import { useState, useRef, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { WheelPage } from "./pages/WheelPage";
import { PlayerListPage } from "./pages/PlayerListPage";
import { BattleZonePage } from "./pages/BattleZonePage";
import { PvPTournamentPage } from "./pages/PvPTournamentPage";
import { PublicBracketPage } from "./pages/PublicBracketPage";
import { WikiPage } from "./pages/WikiPage";
import { SandboxPage } from "./pages/SandboxPage";
import { isTauri } from "./utils/localStorage";
import { fetchAllPlayerTexts } from "./utils/googleDrive";
import { SyncDataDialog } from "./components/SyncDataDialog";
import { PvPRightSidebar } from "./components/combat/PvPRightSidebar";
import { SettingsPage } from "./pages/SettingsPage";

// Check if running in web-only mode (not Tauri)
const isWebOnly = !isTauri();

const navItems = [
  { path: "/wheel", label: "Astrolabe", icon: "🌌" },
  { path: "/players", label: "Player", icon: "📜" },
  { path: "/battle", label: "Combat", icon: "⚔️" },
  { path: "/pvp-tournament", label: "PvP", icon: "🏆" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

// HUD style navigation for Game
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSpinningChange = (
      event: CustomEvent<{ isSpinning: boolean }>,
    ) => {
      setIsWheelSpinning(event.detail.isSpinning);
    };

    window.addEventListener(
      "wheelSpinningChange",
      handleSpinningChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "wheelSpinningChange",
        handleSpinningChange as EventListener,
      );
  }, []);

  // Đóng navbar khi wheel đang spin
  useEffect(() => {
    if (isWheelSpinning) setIsOpen(false);
  }, [isWheelSpinning]);

  // Hide HUD on landing page (sau tất cả hooks)
  if (location.pathname === "/") return null;

  const handleNavigate = (path: string) => {
    if (isWheelSpinning || location.pathname === path) return;
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle button — luôn hiển thị ở góc trái */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isWheelSpinning}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[2001] flex items-center justify-center w-6 h-14 rounded-r-lg transition-all duration-300
          bg-surface/80 border border-primary/30 border-l-0 shadow-[2px_0_8px_rgba(0,0,0,0.4)]
          ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-primary/10 hover:border-primary/60"}
          ${isWheelSpinning ? "opacity-0 pointer-events-none" : ""}
        `}
        title="Mở menu"
      >
        <span className="text-primary text-xs font-bold">›</span>
      </button>

      {/* Overlay mờ khi mở — click để đóng */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1999] bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen w-24 z-[2000] transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full glass-l2 border-r border-primary/20 flex flex-col items-center gap-2 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] bg-surface/80">
          {/* Nút đóng */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-primary transition-colors text-xs"
            title="Đóng menu"
          >
            ‹
          </button>

          <button
            onClick={() => handleNavigate("/")}
            className="p-3 text-primary hover:text-white transition-colors mb-8"
            title="Quit to Title"
          >
            <span className="text-3xl drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">
              🚪
            </span>
          </button>

          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`relative group w-full py-4 flex flex-col items-center gap-2 transition-all duration-300
                  ${isActive ? "bg-primary/10 text-primary border-r-4 border-primary shadow-[inset_0_0_15px_rgba(255,209,108,0.1)]" : "text-gray-400 hover:text-primary hover:bg-white/5 border-r-4 border-transparent"}
                `}
              >
                <span
                  className={`text-2xl transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,209,108,0.8)]" : "group-hover:scale-110"}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`font-display text-[10px] uppercase text-center tracking-wider px-1 ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

type PrefetchStatus = "idle" | "loading" | "done" | "error";

const PrefetchToast = () => {
  const [status, setStatus] = useState<PrefetchStatus>("idle");
  const [count, setCount] = useState(0);

  useEffect(() => {
    setStatus("loading");
    fetchAllPlayerTexts()
      .then((texts) => {
        setCount(texts.size);
        setStatus("done");
        setTimeout(() => setStatus("idle"), 3000);
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "idle") return null;

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex items-center gap-3 glass-l2 border-primary/30 text-white px-5 py-3 rounded-xl shadow-bloom text-sm">
      {status === "loading" && (
        <>
          <div className="flex items-center justify-center w-6 h-6">
            <div className="absolute w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <span className="font-lore text-gray-300">Cooking...</span>
        </>
      )}
      {status === "done" && (
        <>
          <span className="text-secondary drop-shadow-[0_0_4px_rgba(86,241,224,0.8)]">
            ✦
          </span>
          <span className="font-lore text-gray-300">
            Khế ước vĩnh hằng với {count} linh hồn đã thiết lập.
          </span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="text-error">✗</span>
          <span className="font-lore text-gray-300">Đứt kết nối tinh tú.</span>
        </>
      )}
    </div>
  );
};

const SYNC_SEQUENCE = "SYNCDATA";

// Wrapper to animate routes with push effect
const AnimatedRoutes = ({ rightSidebarOpen }: { rightSidebarOpen: boolean }) => {
  const location = useLocation();

  return (
    <div 
      key={location.pathname} 
      className="animate-fade-in min-h-screen transition-all duration-300 ease-in-out"
      style={{ paddingRight: rightSidebarOpen ? "120px" : "0" }}
    >
      <Routes location={location}>
        {isWebOnly ? (
          <>
            <Route path="/" element={<Navigate to="/players" replace />} />
            <Route path="/players" element={<PlayerListPage />} />
            <Route path="/bracket" element={<PublicBracketPage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/players" element={<PlayerListPage />} />
            <Route path="/battle" element={<BattleZonePage />} />
            <Route path="/pvp-tournament" element={<PvPTournamentPage />} />
            <Route path="/bracket" element={<PublicBracketPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        )}
      </Routes>
    </div>
  );
};

function App() {
  const [showSync, setShowSync] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const syncKeyBuffer = useRef("");
  const syncKeyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    const handleKey = (e: KeyboardEvent) => {
      // Chỉ nhận ký tự đơn, không modifier
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return;

      syncKeyBuffer.current += e.key.toUpperCase();

      // Reset buffer sau 2s không gõ
      if (syncKeyTimer.current) clearTimeout(syncKeyTimer.current);
      syncKeyTimer.current = setTimeout(() => {
        syncKeyBuffer.current = "";
      }, 2000);

      // Check nếu buffer kết thúc bằng SYNCDATA
      if (syncKeyBuffer.current.endsWith(SYNC_SEQUENCE)) {
        syncKeyBuffer.current = "";
        if (syncKeyTimer.current) clearTimeout(syncKeyTimer.current);
        setShowSync(true);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSidebarButtonClick = (type: string) => {
    console.log(`Global Sidebar Button Clicked: ${type}`);
    // Future: Dispatch event or open global modal
    const event = new CustomEvent("pvp-wheel-request", { detail: { type } });
    window.dispatchEvent(event);
  };

  return (
    <HashRouter>
      {!isWebOnly && <Navigation />}
      <PrefetchToast />
      {showSync && <SyncDataDialog onClose={() => setShowSync(false)} />}
      <AnimatedRoutes rightSidebarOpen={rightSidebarOpen} />
      <PvPRightSidebar 
        isOpen={rightSidebarOpen} 
        onToggle={setRightSidebarOpen} 
        onButtonClick={handleSidebarButtonClick}
      />
    </HashRouter>
  );
}

export default App;
