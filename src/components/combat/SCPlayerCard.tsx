import { CharacterStats } from "../../types/character";
import { PvPPlayerData } from "../../types/battleZone";
import { STAT_ORDER } from "../../constants/battleZone";

export interface SCPlayerCardProps {
  player: PvPPlayerData;
  side: "left" | "right";
  isWinner: boolean;
  showWinner: boolean;
  displayStats?: CharacterStats | null;
}

export const SCPlayerCard = ({
  player,
  side,
  isWinner,
  showWinner,
  displayStats,
}: SCPlayerCardProps) => {
  const stats = displayStats ?? player.stats;
  const isLeft = side === "left";
  const borderGlow =
    showWinner && isWinner
      ? "border-yellow-400/80 shadow-xl shadow-yellow-500/20"
      : isLeft
        ? "border-blue-500/60 shadow-lg shadow-blue-900/30"
        : "border-red-500/60 shadow-lg shadow-red-900/30";
  const race = player.character?.race?.race || player.race;
  const subRace = player.character?.race?.subRace || "";
  const total = STAT_ORDER.reduce((s, { key }) => s + (stats[key] || 0), 0);
  const maxStat = Math.max(...STAT_ORDER.map(({ key }) => stats[key] || 0));

  // Bar gradient per stat
  const BAR_COLORS: Record<string, string> = {
    str: "from-orange-600 to-red-500",
    spd: "from-cyan-500 to-blue-400",
    dur: "from-lime-600 to-green-500",
    iq: "from-purple-500 to-violet-400",
    biq: "from-indigo-500 to-blue-500",
    ma: "from-pink-500 to-fuchsia-400",
  };

  return (
    <div
      className={`relative rounded-none border-2 overflow-hidden transition-all duration-300 ${borderGlow}`}
      style={{
        background: "linear-gradient(160deg, #0f172a 60%, #1e1b4b 100%)",
      }}
    >
      {/* Decorative corner accent */}
      <div
        className={`absolute top-0 ${isLeft ? "left-0" : "right-0"} w-12 h-12 opacity-20`}
        style={{
          background: `radial-gradient(circle at ${isLeft ? "top left" : "top right"}, ${isLeft ? "#3b82f6" : "#ef4444"}, transparent 70%)`,
        }}
      />

      {/* ── Name plate ── */}
      <div
        className={`px-3 py-2 border-b ${isLeft ? "border-blue-700/40 bg-blue-950/40" : "border-red-700/40 bg-red-950/40"} flex items-center gap-2 ${!isLeft ? "flex-row-reverse" : ""}`}
      >
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isLeft ? "bg-blue-800/60 text-blue-300" : "bg-red-800/60 text-red-300"}`}
        >
          #{player.no}
        </span>
        <div className={`flex-1 min-w-0 ${!isLeft ? "text-right" : ""}`}>
          <div className="text-sm font-black text-white truncate leading-tight tracking-wide">
            {player.name}
          </div>
          <div
            className={`text-[10px] font-medium truncate ${isLeft ? "text-blue-300/70" : "text-red-300/70"}`}
          >
            {race}
            {subRace ? ` · ${subRace}` : ""}
          </div>
        </div>
        {showWinner && isWinner && (
          <span className="text-yellow-300 text-[11px] font-black bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
            ★ WIN
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="px-3 py-2.5 space-y-1.5">
        {STAT_ORDER.map(({ key, label }) => {
          const val = stats[key] || 0;
          const pct = Math.min((val / 20) * 100, 100); // max 20 for bar
          const isTop = val === maxStat;
          const barGrad = BAR_COLORS[key] ?? "from-gray-500 to-gray-400";
          return (
            <div
              key={key}
              className={`flex items-center gap-2 ${!isLeft ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`w-7 text-[10px] font-bold text-center shrink-0 ${isTop ? (isLeft ? "text-blue-300" : "text-red-300") : "text-gray-500"}`}
              >
                {label}
              </span>
              <div className="flex-1 bg-gray-800/70 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGrad} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`w-6 text-center text-[13px] font-black shrink-0 ${isTop ? "text-white" : "text-gray-400"}`}
              >
                {val}
              </span>
            </div>
          );
        })}

        {/* Total row */}
        <div
          className={`flex items-center gap-2 mt-1 pt-1.5 border-t ${isLeft ? "border-blue-800/40" : "border-red-800/40"} ${!isLeft ? "flex-row-reverse" : ""}`}
        >
          <span
            className={`w-7 text-[10px] font-bold text-center ${isLeft ? "text-blue-400/70" : "text-red-400/70"}`}
          >
            TTL
          </span>
          <div className="flex-1" />
          <span
            className={`w-6 text-center text-sm font-black ${isLeft ? "text-blue-300" : "text-red-300"}`}
          >
            {total}
          </span>
        </div>
      </div>

      {/* Bottom glow line */}
      <div
        className={`h-0.5 w-full ${isLeft ? "bg-gradient-to-r from-blue-500/60 via-blue-400/30 to-transparent" : "bg-gradient-to-l from-red-500/60 via-red-400/30 to-transparent"}`}
      />
    </div>
  );
};
