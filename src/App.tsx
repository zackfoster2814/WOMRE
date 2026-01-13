import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { WheelPage } from "./pages/WheelPage";
import { PlayerListPage } from "./pages/PlayerListPage";
import { BattleZonePage } from "./pages/BattleZonePage";

// Navigation component
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show nav on landing page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed top-4 left-4 z-50 flex gap-2">
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700 border border-gray-600 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl"
        title="Back to Home"
      >
        🏠 Home
      </button>

      {location.pathname !== "/wheel" && (
        <button
          onClick={() => navigate("/wheel")}
          className="px-4 py-2 bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          🎡 Wheel
        </button>
      )}

      {location.pathname !== "/players" && (
        <button
          onClick={() => navigate("/players")}
          className="px-4 py-2 bg-green-600/90 backdrop-blur-sm hover:bg-green-700 border border-green-500 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          👥 Players
        </button>
      )}

      {location.pathname !== "/battle" && (
        <button
          onClick={() => navigate("/battle")}
          className="px-4 py-2 bg-red-600/90 backdrop-blur-sm hover:bg-red-700 border border-red-500 rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          ⚔️ Battle
        </button>
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
