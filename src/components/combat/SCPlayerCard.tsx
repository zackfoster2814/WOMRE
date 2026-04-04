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

function getHouseGradientForSC(player: PvPPlayerData): string {
  const activeHouses = player.character?.houses?.filter((h) => !h.isLost) || [];
  if (activeHouses.length === 0)
    return "linear-gradient(160deg, #0f172a 60%, #1e1b4b 100%)";
  const houseName = activeHouses[0].name.toLowerCase();

  if (houseName.includes("Dothraki"))
    return "linear-gradient(160deg, #78350f 0%, #0f172a 100%)";
  if (houseName.includes("valhalla"))
    return "linear-gradient(160deg, #1e3a8a 0%, #0f172a 100%)";
  if (houseName.includes("eldritch"))
    return "linear-gradient(160deg, #4c1d95 0%, #0f172a 100%)";
  if (houseName.includes("sylvan"))
    return "linear-gradient(160deg, #14532d 0%, #0f172a 100%)";
  if (houseName.includes("roundtable"))
    return "linear-gradient(160deg, #713f12 0%, #0f172a 100%)";
  if (houseName.includes("Uchiha"))
    return "linear-gradient(160deg, #020617 0%, #0f172a 100%)";
  if (houseName.includes("Stark"))
    return "linear-gradient(160deg, #164e63 0%, #0f172a 100%)";

  return "linear-gradient(160deg, #0f172a 60%, #1e1b4b 100%)";
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
  const isTraitor = player.character?.houses?.some(
    (h) => h.isLost && (h as any).lostType !== "kinda_homeless",
  );

  const borderGlow =
    showWinner && isWinner
      ? "border-amber-400/80 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(255,209,108,0.5)]"
      : isTraitor
        ? "border-red-600/80 ring-1 ring-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
        : isLeft
          ? "border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          : "border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]";

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
      className={`relative rounded-xl overflow-hidden transition-all duration-300 card-magic glass-l2 ${borderGlow} ${isTraitor ? "rune-glow-red" : ""}`}
      style={{
        background: getHouseGradientForSC(player),
      }}
    >
      {/* Decorative corner accent */}
      <div
        className={`absolute top-0 ${isLeft ? "left-0" : "right-0"} w-12 h-12 opacity-20 pointer-events-none`}
        style={{
          background: `radial-gradient(circle at ${isLeft ? "top left" : "top right"}, ${isLeft ? "#3b82f6" : "#ef4444"}, transparent 70%)`,
        }}
      />

      {/* ── Name plate ── */}
      <div
        className={`px-3 py-2 border-b ${isLeft ? "border-blue-700/30 bg-blue-950/30" : "border-red-700/30 bg-red-950/30"} flex items-center gap-2 ${!isLeft ? "flex-row-reverse" : ""}`}
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
