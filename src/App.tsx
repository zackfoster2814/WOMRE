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
import { TeamBattlePage } from "./pages/TeamBattlePage";
import { isTauri } from "./utils/localStorage";

// Check if running in web-only mode (not Tauri)
const isWebOnly = !isTauri();

const navItems = [
  { path: "/", label: "Wheel of Name", color: "bg-blue-600" },
  { path: "/players", label: "Players", color: "bg-green-600" },
  { path: "/battles", label: "Team Battles", color: "bg-orange-600" },
  { path: "/battle", label: "Battle Zone", color: "bg-red-600" },
];

// Navigation component
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Get current page label
  const currentPage = navItems.find((item) => item.path === location.pathname);

  return (
    <nav className="fixed top-4 left-4 z-[9999]" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
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
            {/* Web-only mode: only allow /players, redirect everything else */}
            <Route path="/players" element={<PlayerListPage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </>
        ) : (
          <>
            {/* Full Tauri app: Wheel of Name is default */}
            <Route path="/" element={<WheelPage />} />
            <Route path="/players" element={<PlayerListPage />} />
            <Route path="/battles" element={<TeamBattlePage />} />
            <Route path="/battle" element={<BattleZonePage />} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;
