import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Menu from "./pages/Menu";
import CharacterWheel from "./pages/CharacterWheel";
import DataManager from "./pages/DataManager";
import PlayerInfo from "./pages/PlayerInfo";

import { ResultProvider } from "./components/setResult.tsx";

export default function App() {
  return (
    <ResultProvider>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<CharacterWheel />} />
        <Route path="/data" element={<DataManager />} />
        <Route path="/player/:id" element={<PlayerInfo />} />
      </Routes>
    </ResultProvider>
  );
}
