import { useState, useRef, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { WheelPage } from "./pages/WheelPage";
import { PlayerListPage } from "./pages/PlayerListPage";
import { BattleZonePage } from "./pages/BattleZonePage";
import { PvPTournamentPage } from "./pages/PvPTournamentPage";
import { PublicBracketPage } from "./pages/PublicBracketPage";
import { WikiPage } from "./pages/WikiPage";
import { SandboxPage } from "./pages/SandboxPage";
// import { TeamBattlePage } from "./pages/TeamBattlePage";
import { isTauri } from "./utils/localStorage";

// Check if running in web-only mode (not Tauri)
const isWebOnly = !isTauri();

const navItems = [
  { path: "/", label: "Wheel of Name", color: "bg-blue-600" },
  { path: "/players", label: "Players", color: "bg-green-600" },
  // { path: "/battles", label: "Team Battles", color: "bg-orange-600" },
  { path: "/battle", label: "Battle Zone", color: "bg-red-600" },
  { path: "/pvp-tournament", label: "PvP Tournament", color: "bg-purple-600" },
  { path: "/sandbox", label: "Sandbox", color: "bg-amber-600" },
  // { path: "/wiki", label: "Wiki", color: "bg-cyan-600" },
];

// Navigation component
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to wheel spinning state changes
  useEffect(() => {
    const handleSpinningChange = (
      event: CustomEvent<{ isSpinning: boolean }>,
    ) => {
      setIsWheelSpinning(event.detail.isSpinning);
      // Close dropdown if wheel starts spinning
      if (event.detail.isSpinning) {
        setIsOpen(false);
      }
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

  const handleNavigate = (path: string) => {
    if (isWheelSpinning) return;
    navigate(path);
    setIsOpen(false);
  };

  const handleToggleMenu = () => {
    if (isWheelSpinning) return;
    setIsOpen(!isOpen);
  };

  // Get current page label
  const currentPage = navItems.find((item) => item.path === location.pathname);

  return (
    <nav className="fixed top-4 left-4 z-[2000]" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={handleToggleMenu}
        className={`px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2 ${
          isWheelSpinning
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-700 hover:shadow-xl"
        }`}
      >
        <span>☰</span>
        <span>{currentPage?.label || "Menu"}</span>
        <span
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full px-4 py-3 flex items-center gap-2 transition-all text-left
                  ${
                    isActive
                      ? `${item.color} text-white font-semibold`
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="ml-auto text-xs">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

function App() {
  return (
    <HashRouter>
      {/* Hide navigation in web-only mode */}
      {!isWebOnly && <Navigation />}
      <Routes>
        {isWebOnly ? (
          <>
            {/* Web-only mode: only allow /players and /bracket */}
            <Route path="/players" element={<PlayerListPage />} />
            <Route path="/bracket" element={<PublicBracketPage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </>
        ) : (
          <>
            {/* Full Tauri app: Wheel of Name is default */}
            <Route path="/" element={<WheelPage />} />
            <Route path="/players" element={<PlayerListPage />} />
            {/* <Route path="/battles" element={<TeamBattlePage />} /> */}
            <Route path="/battle" element={<BattleZonePage />} />
            <Route path="/pvp-tournament" element={<PvPTournamentPage />} />
            <Route path="/bracket" element={<PublicBracketPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/wiki" element={<WikiPage />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;
