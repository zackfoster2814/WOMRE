import { useNavigate } from "react-router-dom";
import wheelBgImage from "../assets/img/wheel-bg.png";

export const LandingPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Wheel of Name",
      description: "Spin the wheel and let fate decide!",
      icon: "🎡",
      path: "/wheel",
      accent: "from-secondary/20 to-secondary/5",
      border: "hover:border-secondary/50",
      glow: "hover:shadow-[0_0_24px_4px_rgba(86,241,224,0.12)]",
    },
    {
      title: "Player List",
      description: "Manage your players and their stats",
      icon: "👥",
      path: "/players",
      accent: "from-primary/20 to-primary/5",
      border: "hover:border-primary/50",
      glow: "hover:shadow-[0_0_24px_4px_rgba(255,209,108,0.15)]",
    },
    {
      title: "Battle Zone",
      description: "PvE & PvP battles with stats comparison",
      icon: "⚔️",
      path: "/battle",
      accent: "from-tertiary/20 to-tertiary/5",
      border: "hover:border-tertiary/50",
      glow: "hover:shadow-[0_0_24px_4px_rgba(230,157,255,0.12)]",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-surface/70 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="font-mono text-secondary/60 text-xs tracking-[0.4em] uppercase mb-4">
            ✦ The Arcane Ledger ✦
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-primary mb-5 tracking-wider">
            Wheel of Multiverse
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-amber-500/40" />
            <p className="font-lore text-gray-300 text-base md:text-lg tracking-wide italic">Choose your adventure</p>
            <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-amber-500/40" />
          </div>
        </div>

        {/* Menu cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 card-magic
                bg-slate-900/60 backdrop-blur-md border border-amber-500/20
                shadow-panel-l1 ${item.border} ${item.glow}`}
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.8), inset 0.5px 0.5px 0 rgba(255,255,255,0.06), inset -0.5px -0.5px 0 rgba(0,0,0,0.4)",
              }}
            >
              {/* Hover gradient fill */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-400`} />

              {/* Top accent bar (Bronze/Gold) */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 text-left">
                <div className="text-4xl mb-5">{item.icon}</div>
                <h2 className="font-display text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors duration-200 tracking-wide">
                  {item.title}
                </h2>
                <p className="font-sans text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>

              {/* Corner sigil */}
              <div className="absolute bottom-3 right-4 font-mono text-[10px] text-amber-500/30 group-hover:text-primary/50 transition-colors">
                ✦
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-14">
          <span className="font-mono text-[11px] text-outline/50 tracking-widest uppercase">
            V3.0 Lite Edition
          </span>
        </div>
      </div>
    </div>
  );
};
