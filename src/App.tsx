import { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { WheelPage } from "./pages/WheelPage";
import { PlayerListPage } from "./pages/PlayerListPage";
import { BattleZonePage } from "./pages/BattleZonePage";

const navItems = [
  { path: "/", label: "Home", icon: "", color: "bg-gray-600" },
  { path: "/wheel", label: "Wheel", icon: "", color: "bg-blue-600" },
  { path: "/players", label: "Players", icon: "", color: "bg-green-600" },
  { path: "/battle", label: "Battle", icon: "", color: "bg-red-600" },
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

  // Don't show nav on landing page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed top-4 left-4 z-50" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
      >
        <span>☰</span>
        <span>Menu</span>
        <span
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all text-left
                  ${
                    isActive
                      ? `${item.color} text-white font-semibold`
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
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
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/wheel" element={<WheelPage />} />
        <Route path="/players" element={<PlayerListPage />} />
        <Route path="/battle" element={<BattleZonePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
