import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BattleSession {
  time: string;
  battles: BattleReport[];
}

interface BattleReport {
  player1: string;
  player2: string;
  player1No: string;
  player2No: string;
  raceInfo: string;
  items1: ItemEntry[];
  items2: ItemEntry[];
  stats1: Record<string, string>;
  stats2: Record<string, string>;
  rounds: RoundEntry[];
  spinResults: SpinEntry[];
  afterCombat: AfterEntry[];
  result: string;
  winner: string;
}

interface ItemEntry {
  type: string;
  value: string;
}

interface RoundEntry {
  label: string;
  stat?: string;
  winner?: string;
  score?: string;
  events: string[];
  isPreCombat?: boolean;
}

interface SpinEntry {
  player: string;
  effect: string;
  stat: string;
  outcome: string;
  success: boolean;
}

interface AfterEntry {
  player: string;
  text: string;
}

// ── Parser ────────────────────────────────────────────────────────────────────
// Mỗi session bắt đầu bằng ────... PVP SESSION: ... ────...
// Nội dung trận nằm giữa các cặp ════...

function parseLog(raw: string): BattleSession[] {
  const sessions: BattleSession[] = [];
  // Tách theo pattern: ────...PVP SESSION:...────
  const sessionPattern = /─{20,}\s*\n(PVP SESSION:[^\n]+)\n─{20,}/g;
  let match;
  const sessionStarts: { time: string; index: number }[] = [];

  while ((match = sessionPattern.exec(raw)) !== null) {
    sessionStarts.push({
      time: match[1].replace("PVP SESSION:", "").trim(),
      index: match.index + match[0].length,
    });
  }

  for (let s = 0; s < sessionStarts.length; s++) {
    const start = sessionStarts[s].index;
    const end = s + 1 < sessionStarts.length
      ? sessionStarts[s + 1].index - 100
      : raw.length;
    const body = raw.slice(start, end);
    const battles = parseBattlesFromBlock(body);
    sessions.push({ time: sessionStarts[s].time, battles });
  }

  return sessions;
}

function parseBattlesFromBlock(block: string): BattleReport[] {
  const battles: BattleReport[] = [];
  // Tách theo ════ — mỗi trận: [header player] ════ [body] ════
  const sep = /═{20,}/;
  const parts = block.split(sep);

  for (let i = 0; i < parts.length; i++) {
    const header = parts[i]?.trim();
    if (!header) continue;

    // Match header: "Name (#N) vs Name2 (#N2)"
    const matchLine = header.match(/(.+?)\s*\(#(\d+)\)\s*vs\s*(.+?)\s*\(#(\d+)\)/);
    if (!matchLine) continue;

    // Gộp tất cả parts tiếp theo cho đến khi gặp header trận mới
    let body = "";
    let j = i + 1;
    while (j < parts.length) {
      const next = parts[j]?.trim() ?? "";
      // Nếu gặp header trận mới thì dừng
      if (next.match(/(.+?)\s*\(#(\d+)\)\s*vs\s*(.+?)\s*\(#(\d+)\)/)) break;
      body += "\n" + next;
      j++;
    }
    i = j - 1;

    const [, p1, p1No, p2, p2No] = matchLine;
    const raceLine = header.match(/Race:\s*(.+)/)?.[1] ?? "";

    const report: BattleReport = {
      player1: p1.trim(),
      player2: p2.trim(),
      player1No: p1No,
      player2No: p2No,
      raceInfo: raceLine,
      items1: [],
      items2: [],
      stats1: {},
      stats2: {},
      rounds: [],
      spinResults: [],
      afterCombat: [],
      result: "",
      winner: "",
    };

    const lines = body.split("\n");
    let section = "";
    let currentRound: RoundEntry | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith(`Items & hiệu ứng — ${report.player1}`)) { section = "items1"; continue; }
      if (line.startsWith(`Items & hiệu ứng — ${report.player2}`)) { section = "items2"; continue; }
      if (line.startsWith("Stats vào combat:")) { section = "stats"; continue; }
      if (line.startsWith("Kết quả từng round:")) { section = "rounds"; continue; }
      if (line.startsWith("[Vòng quay trong combat]")) { section = "spins"; continue; }
      if (line.startsWith("[Hiệu ứng sau combat]")) { section = "after"; continue; }
      if (line.startsWith("Kết quả:")) {
        report.result = line.replace("Kết quả:", "").trim();
        const winMatch = report.result.match(/^(.+?)\s+WIN/);
        if (winMatch) report.winner = winMatch[1].trim();
        continue;
      }

      if (section === "items1" || section === "items2") {
        const m = line.match(/^\[(.+?)\]\s+(.+)$/);
        if (m) {
          const entry: ItemEntry = { type: m[1], value: m[2] };
          if (section === "items1") report.items1.push(entry);
          else report.items2.push(entry);
        }
        continue;
      }

      if (section === "stats") {
        const m = line.match(/^\s*(.+?):\s+STR:(\d+)\s+SPD:(\d+)\s+DUR:(\d+)\s+IQ:(\d+)\s+BIQ:(\d+)\s+MA:(\d+)/);
        if (m) {
          const stats = { STR: m[2], SPD: m[3], DUR: m[4], IQ: m[5], BIQ: m[6], MA: m[7] };
          if (m[1].trim() === report.player1) report.stats1 = stats;
          else report.stats2 = stats;
        }
        continue;
      }

      if (section === "rounds") {
        if (line === "[PRE-COMBAT]") {
          currentRound = { label: "Pre-Combat", events: [], isPreCombat: true };
          report.rounds.push(currentRound);
          continue;
        }
        const roundMatch = line.match(/^Round (\d+) — (\w+): (.+?) \((.+?) vs (.+?)\) \| Điểm: (.+)/);
        if (roundMatch) {
          currentRound = {
            label: `Round ${roundMatch[1]}`,
            stat: roundMatch[2],
            winner: roundMatch[3],
            score: roundMatch[6],
            events: [],
          };
          report.rounds.push(currentRound);
          continue;
        }
        if (currentRound && (line.startsWith("·") || line.startsWith("↑") || line.startsWith("Δ"))) {
          currentRound.events.push(line);
        }
        continue;
      }

      if (section === "spins") {
        const m = line.match(/^\[(.+?)\]\s+(.+?)\s+\((\w+)\):\s+(.+?)\s+→\s+(✓|✗)/);
        if (m) {
          report.spinResults.push({
            player: m[1],
            effect: m[2],
            stat: m[3],
            outcome: m[4],
            success: m[5] === "✓",
          });
        }
        continue;
      }

      if (section === "after") {
        const m = line.match(/^\[(.+?)\]\s+(.+)$/);
        if (m) {
          report.afterCombat.push({ player: m[1], text: m[2] });
        }
        continue;
      }
    }

    battles.push(report);
  }

  return battles;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ITEM_TYPE_STYLE: Record<string, string> = {
  race: "bg-purple-900/60 text-purple-300 border-purple-700/50",
  sub_race: "bg-purple-800/40 text-purple-400 border-purple-700/30",
  archetype: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  quirk: "bg-teal-900/60 text-teal-300 border-teal-700/50",
  power: "bg-amber-900/60 text-amber-300 border-amber-700/50",
  gear: "bg-gray-700/60 text-gray-300 border-gray-600/50",
  weapon: "bg-red-900/60 text-red-300 border-red-700/50",
  rune: "bg-cyan-900/60 text-cyan-300 border-cyan-700/50",
  runeword: "bg-cyan-900/40 text-cyan-400 border-cyan-700/30",
  house: "bg-indigo-900/60 text-indigo-300 border-indigo-700/50",
  house_sub: "bg-indigo-800/40 text-indigo-400 border-indigo-600/30",
  char_dev: "bg-green-900/60 text-green-300 border-green-700/50",
  lover: "bg-pink-900/60 text-pink-300 border-pink-700/50",
};

function ItemTag({ type, value }: ItemEntry) {
  const style = ITEM_TYPE_STYLE[type] ?? "bg-gray-800 text-gray-400 border-gray-600/50";
  const label = type === "sub_race" ? "sub" : type === "house_sub" ? "house+" : type === "char_dev" ? "dev" : type;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${style}`}>
      <span className="opacity-60">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

const STAT_KEYS = ["STR", "SPD", "DUR", "IQ", "BIQ", "MA"] as const;
const STAT_COLOR: Record<string, string> = {
  STR: "text-red-400", SPD: "text-yellow-400", DUR: "text-green-400",
  IQ: "text-blue-400", BIQ: "text-purple-400", MA: "text-pink-400",
};

function StatBar({ label, val1, val2 }: { label: string; val1: string; val2: string }) {
  const n1 = parseInt(val1) || 0;
  const n2 = parseInt(val2) || 0;
  const max = Math.max(n1, n2, 1);
  const color = STAT_COLOR[label] ?? "text-gray-300";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-8 text-right font-bold ${color}`}>{val1}</span>
      <div className="flex-1 flex gap-0.5">
        <div className="flex-1 flex justify-end">
          <div
            className={`h-2 rounded-l transition-all ${n1 >= n2 ? "bg-blue-500" : "bg-blue-900/50"}`}
            style={{ width: `${(n1 / max) * 100}%` }}
          />
        </div>
        <span className={`text-[9px] font-bold ${color} w-8 text-center`}>{label}</span>
        <div className="flex-1">
          <div
            className={`h-2 rounded-r transition-all ${n2 >= n1 ? "bg-orange-500" : "bg-orange-900/50"}`}
            style={{ width: `${(n2 / max) * 100}%` }}
          />
        </div>
      </div>
      <span className={`w-8 font-bold ${color}`}>{val2}</span>
    </div>
  );
}

function RoundRow({ round }: { round: RoundEntry }) {
  const [open, setOpen] = useState(false);
  if (round.isPreCombat) {
    return (
      <div className="border border-gray-700/50 rounded bg-gray-800/30">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-left"
          onClick={() => setOpen(!open)}
        >
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20">Pre-Combat</span>
          <span className="text-gray-400 text-xs flex-1">{round.events.length} sự kiện</span>
          <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="px-3 pb-2 space-y-1">
            {round.events.map((e, i) => <EventLine key={i} text={e} />)}
          </div>
        )}
      </div>
    );
  }

  const statColor = STAT_COLOR[round.stat ?? ""] ?? "text-gray-300";
  return (
    <div className="border border-gray-700/50 rounded bg-gray-800/30">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={() => setOpen(open || round.events.length > 0 ? !open : false)}
      >
        <span className="text-[10px] font-bold text-gray-500 w-16">{round.label}</span>
        <span className={`text-xs font-bold ${statColor} w-8`}>{round.stat}</span>
        <span className="text-white text-xs flex-1 truncate">{round.winner}</span>
        <span className="text-gray-400 text-xs font-mono">{round.score}</span>
        {round.events.length > 0 && (
          <span className="text-gray-600 text-xs ml-1">{open ? "▲" : "▼"}</span>
        )}
      </button>
      {open && round.events.length > 0 && (
        <div className="px-3 pb-2 space-y-1">
          {round.events.map((e, i) => <EventLine key={i} text={e} />)}
        </div>
      )}
    </div>
  );
}

function EventLine({ text }: { text: string }) {
  const isEffect = text.startsWith("·");
  const isPermanent = text.startsWith("↑");
  const isScore = text.startsWith("Δ");
  const isNeg = text.includes("-") && isScore;
  const isPos = text.includes("+") && isScore;

  let color = "text-gray-400";
  if (isPermanent) color = "text-cyan-400";
  else if (isScore && isPos) color = "text-green-400";
  else if (isScore && isNeg) color = "text-red-400";
  else if (isScore) color = "text-gray-400";
  else if (isEffect) color = "text-amber-300";

  return (
    <p className={`text-[11px] pl-2 ${color}`}>{text}</p>
  );
}

function BattleCard({ battle }: {
  battle: BattleReport;
}) {
  const [tab, setTab] = useState<"overview" | "items" | "rounds" | "spins" | "after">("overview");

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "items", label: "Items" },
    { id: "rounds", label: `Rounds (${battle.rounds.length})` },
    ...(battle.spinResults.length > 0 ? [{ id: "spins", label: `Spin (${battle.spinResults.length})` }] : []),
    ...(battle.afterCombat.length > 0 ? [{ id: "after", label: "Sau trận" }] : []),
  ] as const;

  const p1Won = battle.winner === battle.player1;
  const p2Won = battle.winner === battle.player2;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-800/60 border-b border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className={`flex-1 text-center ${p1Won ? "opacity-100" : "opacity-50"}`}>
            <p className={`font-bold text-sm ${p1Won ? "text-blue-300" : "text-gray-300"}`}>
              {p1Won && <span className="mr-1">👑</span>}{battle.player1}
            </p>
            <p className="text-gray-500 text-[10px]">#{battle.player1No}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs font-bold">VS</p>
            <p className="text-white text-sm font-bold">{battle.result.match(/(\d+-[\d-]+)/)?.[1] ?? ""}</p>
          </div>
          <div className={`flex-1 text-center ${p2Won ? "opacity-100" : "opacity-50"}`}>
            <p className={`font-bold text-sm ${p2Won ? "text-orange-300" : "text-gray-300"}`}>
              {p2Won && <span className="mr-1">👑</span>}{battle.player2}
            </p>
            <p className="text-gray-500 text-[10px]">#{battle.player2No}</p>
          </div>
        </div>
        {battle.raceInfo && (
          <p className="text-center text-gray-500 text-[10px] mt-1">{battle.raceInfo}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800/40 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              tab === t.id
                ? "text-white border-b-2 border-blue-400 bg-gray-800"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "overview" && (
          <div className="space-y-3">
            <div className="space-y-1">
              {STAT_KEYS.map((k) => (
                <StatBar key={k} label={k} val1={battle.stats1[k] ?? "0"} val2={battle.stats2[k] ?? "0"} />
              ))}
            </div>
            <div className="text-center pt-1">
              <span className={`text-xs font-bold px-3 py-1 rounded ${
                p1Won ? "bg-blue-900/60 text-blue-300" : "bg-orange-900/60 text-orange-300"
              }`}>
                {battle.winner} thắng
              </span>
            </div>
          </div>
        )}

        {tab === "items" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-blue-300 text-xs font-bold mb-2">{battle.player1}</p>
              <div className="flex flex-wrap gap-1">
                {battle.items1.map((item, i) => <ItemTag key={i} {...item} />)}
              </div>
            </div>
            <div>
              <p className="text-orange-300 text-xs font-bold mb-2">{battle.player2}</p>
              <div className="flex flex-wrap gap-1">
                {battle.items2.map((item, i) => <ItemTag key={i} {...item} />)}
              </div>
            </div>
          </div>
        )}

        {tab === "rounds" && (
          <div className="space-y-1">
            {battle.rounds.map((r, i) => <RoundRow key={i} round={r} />)}
          </div>
        )}

        {tab === "spins" && (
          <div className="space-y-1">
            {battle.spinResults.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs border ${
                s.success
                  ? "bg-green-900/20 border-green-800/40"
                  : "bg-gray-800/30 border-gray-700/40"
              }`}>
                <span className={s.success ? "text-green-400" : "text-red-400"}>{s.success ? "✓" : "✗"}</span>
                <span className="text-gray-400 w-24 truncate">{s.player}</span>
                <span className="text-amber-300 flex-1">{s.effect}</span>
                <span className={`${STAT_COLOR[s.stat] ?? "text-gray-400"} w-8`}>{s.stat}</span>
                <span className="text-gray-500 text-[10px]">{s.outcome}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "after" && (
          <div className="space-y-1">
            {battle.afterCombat.map((a, i) => (
              <div key={i} className="flex gap-2 text-xs px-2 py-1.5 rounded bg-gray-800/30 border border-gray-700/40">
                <span className={`font-bold flex-shrink-0 ${a.player === battle.player1 ? "text-blue-400" : "text-orange-400"}`}>
                  {a.player}
                </span>
                <span className="text-gray-300">{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BattleLogViewer({
  content,
  loading,
  onClose,
  onReload,
}: {
  content: string;
  loading: boolean;
  onClose: () => void;
  onReload: () => void;
}) {
  const sessions = useMemo(() => (content ? parseLog(content) : []), [content]);
  const allBattles = useMemo(() => sessions.flatMap((s) => s.battles), [sessions]);
  const [page, setPage] = useState(0);

  const battle = allBattles[page];
  const total = allBattles.length;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
    <div
      className="flex flex-col bg-gray-900 border border-gray-600 shadow-2xl"
      style={{ width: "min(95vw, 780px)", height: "min(90vh, 680px)" }}
      onClick={(e) => e.stopPropagation()}
    >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Battle Log</span>
            {sessions[0] && (
              <span className="text-gray-500 text-xs">{sessions[0].time}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReload}
              disabled={loading}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Reload"}
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-gray-700 hover:bg-red-900 text-gray-300 text-xs rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && !battle && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Đang tải...</p>
          </div>
        )}

        {/* No data */}
        {!loading && total === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Không có dữ liệu trận đấu.</p>
          </div>
        )}

        {/* Battle content */}
        {battle && (
          <div className="flex-1 overflow-hidden">
            <BattleCard battle={battle} />
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-800/60 flex-shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded disabled:opacity-30 transition-colors"
            >
              ← Trước
            </button>
            <div className="flex items-center gap-1">
              {allBattles.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-6 h-6 rounded text-[10px] transition-colors ${
                    i === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                  title={`${b.player1} vs ${b.player2}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
              disabled={page === total - 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded disabled:opacity-30 transition-colors"
            >
              Sau →
            </button>
          </div>
        )}
    </div>
    </div>
  );
}
