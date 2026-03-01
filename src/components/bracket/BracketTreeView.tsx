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
 * - LB R1:  match 256-319 (64 matches - losers from WB R64)
 * - LB R2:  match 320-351 (32 matches)
 * ...
 * - Grand Final: last match
 *
 * Nhưng vì data hiện tại chỉ có match 1-128 (R256) và chưa xác định numbering cho các round sau,
 * ta dùng numbering tổng quát và hiển thị TBD cho các slot chưa có data.
 */

import { useMemo, useRef, useEffect, useCallback } from "react";
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
}

interface OpenMatchCtx {
  matchNumber: number;
  player1No: number;
  player2No: number;
  existingWinnerNo?: number;
  existingScore?: string | null;
  existingSpecialEvent?: string | null;
  existingNote?: string | null;
}

export interface BracketTreeViewProps {
  matches: MatchData[];
  filterMode: "all" | "pending" | "completed";
  onOpenMatch?: (ctx: OpenMatchCtx) => void;
  onSelectMatch?: (match: MatchData) => void;
  readOnly?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_H = 115; // px - đủ cho header + 2 player rows + VS
const CARD_W = 200; // px - rộng hơn để tên không bị cắt
const COL_GAP_SINGLE = 20; // px gap giữa cột đơn (R256, R128) - không có connector
const COL_GAP_TREE = 56; // px gap giữa cột trong DE tree (chứa connectors)
const BASE_GAP = 4; // px gap giữa cards trong cột đầy nhất (R256)
const LABEL_H = 26; // px
const PAD = 16; // px padding ngoài
const SECTION_GAP = 40; // px khoảng cách giữa single-elim section và DE section
const WB_LB_GAP = 60; // px khoảng cách giữa WB và LB

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

// Losers Bracket rounds
const LB_ROUNDS = [
  { label: "LB-R1", matchStart: 256, count: 32 },
  { label: "LB-R2", matchStart: 288, count: 16 },
  { label: "LB-R3", matchStart: 304, count: 8 },
  { label: "LB-R4", matchStart: 312, count: 4 },
  { label: "LB-SF", matchStart: 316, count: 2 },
  { label: "LB-Final", matchStart: 318, count: 1 },
];

// Grand Final
const GRAND_FINAL = { label: "Grand Final", matchStart: 319, count: 1 };

// ── Layout math ───────────────────────────────────────────────────────────────

/** Pitch (khoảng cách trung tâm → trung tâm) của match trong DE tree column.
 *  Column 0 là WB R64 (32 matches), mỗi round tiếp theo gấp đôi pitch. */
function getWBPitch(colIndex: number): number {
  const basePitch = CARD_H + BASE_GAP;
  return basePitch * Math.pow(2, colIndex);
}

/** Y tâm của match trong WB tại colIndex, posInRound */
function getWBCenterY(colIndex: number, posInRound: number): number {
  const pitch = getWBPitch(colIndex);
  return pitch / 2 + posInRound * pitch;
}

/** Y top của card trong WB */
function getWBTopY(colIndex: number, posInRound: number): number {
  return getWBCenterY(colIndex, posInRound) - CARD_H / 2;
}

/** Tổng chiều cao của WB section (colIndex=0 là R64 với 32 matches) */
function getWBHeight(): number {
  return 32 * (CARD_H + BASE_GAP) + BASE_GAP;
}

/** LB pitch tại colIndex (LB có ít matches hơn, giãn ra tương ứng) */
function getLBPitch(colIndex: number): number {
  // LB-R1 có 32 matches, mỗi round tiếp theo pitch tăng gấp đôi
  const basePitch = CARD_H + BASE_GAP;
  return basePitch * Math.pow(2, colIndex);
}

function getLBCenterY(colIndex: number, posInRound: number): number {
  const pitch = getLBPitch(colIndex);
  return pitch / 2 + posInRound * pitch;
}

function getLBTopY(colIndex: number, posInRound: number): number {
  return getLBCenterY(colIndex, posInRound) - CARD_H / 2;
}

function getLBHeight(): number {
  return 32 * (CARD_H + BASE_GAP) + BASE_GAP;
}

// ── Match Card ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchData;
  topPx: number;
  leftPx: number;
  dimmed: boolean;
  onOpen: (match: MatchData) => void;
}

function MatchCard({ match, topPx, leftPx, dimmed, onOpen }: MatchCardProps) {
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
        zIndex: 2,
        opacity: dimmed ? 0.15 : 1,
        transition: "opacity 0.2s, transform 0.15s, box-shadow 0.15s",
        cursor: canClick ? "pointer" : "default",
      }}
      className={`
        text-left rounded-lg border
        ${hasWinner ? "bg-gray-800/95 border-green-600/60" : "bg-gray-800/95 border-gray-600/50"}
        ${
          canClick && !dimmed
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
          #{match.matchNumber}
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
      className="rounded-lg border border-gray-700/25 bg-gray-900/35 flex flex-col items-center justify-center gap-1"
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

// ── Connector H-V-H ───────────────────────────────────────────────────────────
// Vẽ connector từ 2 match con → 1 match cha bên phải

interface HVHConnectorProps {
  topY: number; // Y tâm match trên (absolute trong canvas)
  bottomY: number; // Y tâm match dưới
  leftX: number; // X bên phải của 2 match con (card right edge)
  rightX: number; // X bên trái của match cha
  glowing: boolean;
  dimmed: boolean;
}

function HVHConnector({
  topY,
  bottomY,
  leftX,
  rightX,
  glowing,
  dimmed,
}: HVHConnectorProps) {
  const midX = (leftX + rightX) / 2;
  const midY = (topY + bottomY) / 2;
  const color = glowing ? "rgba(74,222,128,0.8)" : "rgba(124,58,237,0.5)";
  const opacity = dimmed ? 0.07 : 1;
  const shadow = glowing ? "0 0 5px 2px rgba(74,222,128,0.4)" : "none";

  const s = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    backgroundColor: color,
    opacity,
    boxShadow: shadow,
    ...extra,
  });

  return (
    <>
      {/* Arm phải từ match trên */}
      <div
        style={s({
          left: leftX,
          top: topY - 1,
          width: midX - leftX,
          height: 2,
        })}
      />
      {/* Arm phải từ match dưới */}
      <div
        style={s({
          left: leftX,
          top: bottomY - 1,
          width: midX - leftX,
          height: 2,
        })}
      />
      {/* Vertical bar */}
      <div
        style={s({
          left: midX - 1,
          top: Math.min(topY, bottomY),
          width: 2,
          height: Math.abs(bottomY - topY),
        })}
      />
      {/* Arm trái vào match cha */}
      <div
        style={s({
          left: midX,
          top: midY - 1,
          width: rightX - midX,
          height: 2,
        })}
      />
    </>
  );
}

// ── Section renderer helpers ──────────────────────────────────────────────────

/** Render một DE tree (WB hoặc LB).
 *  @param rounds - array of {label, matchStart, count}
 *  @param startLeft - X start của cột đầu tiên
 *  @param topOffset - Y offset (absolute trong canvas)
 *  @param matchMap
 *  @param getPitchFn - function(colIndex) => pitch
 *  @param getCenterYFn - function(colIndex, pos) => centerY (relative, không tính topOffset và LABEL_H)
 */
// ── renderDETree: render cards + connectors cho WB hoặc LB ───────────────────

function renderDETree(
  rounds: { label: string; matchStart: number; count: number }[],
  startLeft: number,
  topOffset: number,
  matchMap: Map<number, MatchData>,
  filterMode: "all" | "pending" | "completed",
  onOpen: (match: MatchData) => void,
  getCenterYFn: (ci: number, pos: number) => number,
  getTopYFn: (ci: number, pos: number) => number,
): { nodes: React.ReactNode[]; colLefts: number[]; totalWidth: number } {
  const nodes: React.ReactNode[] = [];
  const colLefts: number[] = [];
  let curLeft = startLeft;
  for (let ci = 0; ci < rounds.length; ci++) {
    colLefts.push(curLeft);
    curLeft += CARD_W + (ci < rounds.length - 1 ? COL_GAP_TREE : 0);
  }
  const totalWidth = curLeft - startLeft;

  const isDimmed = (match: MatchData): boolean => {
    if (filterMode === "completed") return !match.winner;
    if (filterMode === "pending") return !!match.winner;
    return false;
  };

  for (let ci = 0; ci < rounds.length; ci++) {
    const round = rounds[ci];
    const leftX = colLefts[ci];

    for (let i = 0; i < round.count; i++) {
      const matchNumber = round.matchStart + i;
      const match = matchMap.get(matchNumber);
      const topY = topOffset + getTopYFn(ci, i);
      const dimmed = match ? isDimmed(match) : false;

      if (match && (match.player1 || match.player2)) {
        nodes.push(
          <MatchCard
            key={`match-${matchNumber}`}
            match={match}
            topPx={topY}
            leftPx={leftX}
            dimmed={dimmed}
            onOpen={onOpen}
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

      const isEven = i % 2 === 0;
      if (isEven && ci < rounds.length - 1) {
        const m0 = match;
        const m1 = matchMap.get(round.matchStart + i + 1);
        const centerY0 = topOffset + getCenterYFn(ci, i);
        const centerY1 = topOffset + getCenterYFn(ci, i + 1);
        const leftEdge = leftX + CARD_W;
        const rightEdge = colLefts[ci + 1];
        const connectorGlowing = !!(m0?.winner && m1?.winner);
        const dim0 = m0 ? isDimmed(m0) : true;
        const dim1 = m1 ? isDimmed(m1) : true;
        nodes.push(
          <HVHConnector
            key={`conn-${round.label}-${i}`}
            topY={centerY0}
            bottomY={centerY1}
            leftX={leftEdge}
            rightX={rightEdge}
            glowing={connectorGlowing}
            dimmed={dim0 && dim1}
          />,
        );
      }
    }
  }

  return { nodes, colLefts, totalWidth };
}

// ── Main BracketTreeView ──────────────────────────────────────────────────────

export function BracketTreeView({
  matches,
  filterMode,
  onOpenMatch,
  onSelectMatch,
  readOnly = false,
}: BracketTreeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const matchMap = useMemo(() => {
    const m = new Map<number, MatchData>();
    matches.forEach((match) => m.set(match.matchNumber, match));
    return m;
  }, [matches]);

  // Sync scroll ngang giữa header và canvas
  const onCanvasScroll = useCallback(() => {
    if (scrollRef.current && headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onCanvasScroll, { passive: true });
    return () => el.removeEventListener("scroll", onCanvasScroll);
  }, [onCanvasScroll]);

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
      });
    }
  };

  // ── Tính layout ──────────────────────────────────────────────────────────────

  const pitch = CARD_H + BASE_GAP;

  // Single elim: không có topOffset cho LABEL_H (header riêng)
  const singleElimHeight = 128 * pitch + BASE_GAP;

  let curLeft = PAD;
  const singleColLefts: number[] = [];
  for (let _ri = 0; _ri < SINGLE_ROUNDS.length; _ri++) {
    singleColLefts.push(curLeft);
    curLeft += CARD_W + COL_GAP_SINGLE;
  }

  const deSectionLeft = curLeft + SECTION_GAP - COL_GAP_SINGLE;

  const wbHeight = getWBHeight();
  const wbTop = PAD;
  const lbHeight = getLBHeight();
  const lbTop = wbTop + wbHeight + WB_LB_GAP;

  const totalCanvasHeight =
    Math.max(singleElimHeight, lbTop + lbHeight) + PAD * 2;

  const wbTotalWidth = WB_ROUNDS.length * (CARD_W + COL_GAP_TREE);
  const gfLeft = deSectionLeft + wbTotalWidth + SECTION_GAP / 2;
  const gfCenterY = (wbTop + wbHeight / 2 + lbTop + lbHeight / 2) / 2;
  const gfTopY = gfCenterY - CARD_H / 2;

  const totalCanvasWidth = gfLeft + CARD_W + PAD;

  // ── Build canvas nodes ────────────────────────────────────────────────────────

  const canvasNodes: React.ReactNode[] = [];

  // Vertical section separator giữa single-elim và DE
  const sepX = deSectionLeft - SECTION_GAP / 2;
  canvasNodes.push(
    <div
      key="sep-main"
      style={{
        position: "absolute",
        left: sepX,
        top: 0,
        width: 1,
        height: totalCanvasHeight,
        background:
          "linear-gradient(to bottom, transparent, rgba(124,58,237,0.3) 20%, rgba(124,58,237,0.3) 80%, transparent)",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />,
  );

  // WB/LB separator
  const wbLbSepY = wbTop + wbHeight + WB_LB_GAP / 2;
  canvasNodes.push(
    <div
      key="sep-wblb"
      style={{
        position: "absolute",
        left: deSectionLeft,
        top: wbLbSepY,
        width: totalCanvasWidth - deSectionLeft - PAD,
        height: 1,
        background:
          "linear-gradient(to right, transparent, rgba(124,58,237,0.25) 10%, rgba(124,58,237,0.25) 90%, transparent)",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />,
  );

  // Single elim cards (R256, R128) - cards start at y=PAD, no label offset here
  for (let ri = 0; ri < SINGLE_ROUNDS.length; ri++) {
    const r = SINGLE_ROUNDS[ri];
    const leftX = singleColLefts[ri];

    // Vertical round divider (chỉ giữa các cột trong single section)
    if (ri > 0) {
      canvasNodes.push(
        <RoundDivider
          key={`sdiv-${ri}`}
          leftX={leftX - COL_GAP_SINGLE / 2}
          height={totalCanvasHeight}
        />,
      );
    }

    for (let i = 0; i < r.count; i++) {
      const matchNumber = r.matchStart + i;
      const match = matchMap.get(matchNumber);
      const topY = PAD + i * pitch;
      const isDimmed = match
        ? filterMode === "completed"
          ? !match.winner
          : filterMode === "pending"
            ? !!match.winner
            : false
        : false;

      if (match && (match.player1 || match.player2)) {
        canvasNodes.push(
          <MatchCard
            key={`match-${matchNumber}`}
            match={match}
            topPx={topY}
            leftPx={leftX}
            dimmed={isDimmed}
            onOpen={handleOpen}
          />,
        );
      } else {
        canvasNodes.push(
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

  // WB Tree
  const { nodes: wbNodes, colLefts: wbColLefts } = renderDETree(
    WB_ROUNDS,
    deSectionLeft,
    wbTop,
    matchMap,
    filterMode,
    handleOpen,
    getWBCenterY,
    getWBTopY,
  );
  canvasNodes.push(...wbNodes);

  // Vertical dividers giữa WB columns
  for (let ci = 1; ci < wbColLefts.length; ci++) {
    const divX = wbColLefts[ci] - COL_GAP_TREE / 2;
    canvasNodes.push(
      <RoundDivider
        key={`wbdiv-${ci}`}
        leftX={divX}
        height={wbTop + wbHeight}
      />,
    );
  }

  // LB Tree
  const { nodes: lbNodes, colLefts: lbColLefts } = renderDETree(
    LB_ROUNDS,
    deSectionLeft,
    lbTop,
    matchMap,
    filterMode,
    handleOpen,
    getLBCenterY,
    getLBTopY,
  );
  canvasNodes.push(...lbNodes);

  // Vertical dividers giữa LB columns
  for (let ci = 1; ci < lbColLefts.length; ci++) {
    const divX = lbColLefts[ci] - COL_GAP_TREE / 2;
    canvasNodes.push(
      <RoundDivider
        key={`lbdiv-${ci}`}
        leftX={divX}
        height={totalCanvasHeight - lbTop}
      />,
    );
  }

  // Grand Final
  const gfMatch = matchMap.get(GRAND_FINAL.matchStart);
  const gfDimmed = gfMatch
    ? filterMode === "completed"
      ? !gfMatch.winner
      : filterMode === "pending"
        ? !!gfMatch.winner
        : false
    : false;
  if (gfMatch && (gfMatch.player1 || gfMatch.player2)) {
    canvasNodes.push(
      <MatchCard
        key="match-gf"
        match={gfMatch}
        topPx={gfTopY}
        leftPx={gfLeft}
        dimmed={gfDimmed}
        onOpen={handleOpen}
      />,
    );
  } else {
    canvasNodes.push(
      <TBDSlot
        key="tbd-gf"
        topPx={gfTopY}
        leftPx={gfLeft}
        matchNumber={GRAND_FINAL.matchStart}
      />,
    );
  }

  // ── Build sticky header info ──────────────────────────────────────────────────
  // Danh sách tất cả columns với label và leftX, để render sticky header

  interface HeaderCol {
    label: string;
    leftX: number;
    section?: string;
  }
  const headerCols: HeaderCol[] = [];

  // Single elim headers
  for (let ri = 0; ri < SINGLE_ROUNDS.length; ri++) {
    headerCols.push({
      label: SINGLE_ROUNDS[ri].label,
      leftX: singleColLefts[ri],
      section: ri === 0 ? "Single Elim" : undefined,
    });
  }
  // WB headers
  for (let ci = 0; ci < WB_ROUNDS.length; ci++) {
    headerCols.push({
      label: WB_ROUNDS[ci].label,
      leftX: wbColLefts[ci],
      section: ci === 0 ? "Winners Bracket" : undefined,
    });
  }
  // LB headers
  for (let ci = 0; ci < LB_ROUNDS.length; ci++) {
    headerCols.push({
      label: LB_ROUNDS[ci].label,
      leftX: lbColLefts[ci],
      section: ci === 0 ? "Losers Bracket" : undefined,
    });
  }
  // Grand Final header
  headerCols.push({ label: GRAND_FINAL.label, leftX: gfLeft, section: "GF" });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full rounded-xl border border-gray-700/40 flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 400px)", minHeight: 400 }}
    >
      {/* Three.js background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <BracketBackground3D />
      </div>

      {/* ── Sticky header row (scroll sync với canvas) ── */}
      <div
        ref={headerScrollRef}
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          zIndex: 5,
          height: LABEL_H + 2,
          overflowX: "hidden",
          overflowY: "hidden",
          background: "rgba(9,11,17,0.92)",
          borderBottom: "1px solid rgba(124,58,237,0.3)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Inner div có cùng totalCanvasWidth để sync scroll */}
        <div
          style={{
            position: "relative",
            width: totalCanvasWidth,
            height: LABEL_H,
          }}
        >
          {headerCols.map((col) => (
            <div
              key={col.label}
              style={{
                position: "absolute",
                left: col.leftX,
                top: 0,
                width: CARD_W,
                height: LABEL_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="text-[10px] text-purple-400 font-bold tracking-wider select-none">
                {col.label}
              </span>
            </div>
          ))}
          {/* Section labels nổi bật ở trên header */}
          {/* Single Elim label */}
          <div
            style={{
              position: "absolute",
              left: singleColLefts[0],
              top: 0,
              pointerEvents: "none",
            }}
          >
            <span className="text-[8px] text-gray-600 uppercase tracking-widest ml-1 leading-none">
              Single Elim
            </span>
          </div>
          {/* DE label */}
          <div
            style={{
              position: "absolute",
              left: deSectionLeft,
              top: 0,
              pointerEvents: "none",
            }}
          >
            <span className="text-[8px] text-purple-700 uppercase tracking-widest ml-1 leading-none">
              Double Elim
            </span>
          </div>
        </div>
      </div>

      {/* ── Canvas scroll area ── */}
      <div
        ref={scrollRef}
        className="bracket-scroll relative flex-1 min-h-0"
        style={{
          zIndex: 1,
          overflowX: "scroll",
          overflowY: "auto",
          scrollbarWidth: "auto",
          scrollbarColor: "rgba(124,58,237,0.55) rgba(17,24,39,0.9)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: totalCanvasWidth,
            height: totalCanvasHeight,
          }}
        >
          {/* WB label floating */}
          <div
            style={{
              position: "absolute",
              left: deSectionLeft,
              top: wbTop,
              pointerEvents: "none",
              zIndex: 4,
            }}
          >
            <span className="text-[9px] text-emerald-600/70 font-semibold uppercase tracking-widest">
              WB
            </span>
          </div>
          {/* LB label floating */}
          <div
            style={{
              position: "absolute",
              left: deSectionLeft,
              top: lbTop,
              pointerEvents: "none",
              zIndex: 4,
            }}
          >
            <span className="text-[9px] text-orange-600/70 font-semibold uppercase tracking-widest">
              LB
            </span>
          </div>

          {canvasNodes}
        </div>
      </div>

      {/* Gradient fade trái/phải */}
      <div
        className="absolute left-0 w-6 pointer-events-none"
        style={{
          zIndex: 3,
          top: LABEL_H + 2,
          bottom: 12,
          background:
            "linear-gradient(to right, rgba(17,24,39,0.6), transparent)",
        }}
      />
      <div
        className="absolute right-0 w-6 pointer-events-none"
        style={{
          zIndex: 3,
          top: LABEL_H + 2,
          bottom: 12,
          background:
            "linear-gradient(to left, rgba(17,24,39,0.6), transparent)",
        }}
      />
    </div>
  );
}
