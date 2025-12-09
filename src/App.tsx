import { Routes, Route } from "react-router-dom";

import Menu from "./pages/Menu";
import CharacterWheel from "./pages/CharacterWheel";
import DataManager from "./pages/DataManager";
import PlayerInfo from "./pages/PlayerInfo";
import PlayerEditor from "./pages/PlayerEditor";
import BattleMode from "./pages/BattleMode";
import PvEBattle from "./pages/PvEBattle";
import PvPBattle from "./pages/PvPBattle";

import { ResultProvider } from "./components/setResult.tsx";

export default function App() {
  return (
    <ResultProvider>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<CharacterWheel />} />
        <Route path="/data" element={<DataManager />} />
        <Route path="/player/:id" element={<PlayerInfo />} />
        <Route path="/player-editor" element={<PlayerEditor />} />
        <Route path="/battle" element={<BattleMode />} />
        <Route path="/battle/pve" element={<PvEBattle />} />
        <Route path="/battle/pvp" element={<PvPBattle />} />
      </Routes>
    </ResultProvider>
  );
}
