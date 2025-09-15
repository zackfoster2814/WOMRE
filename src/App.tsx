import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Menu from "./pages/Menu";
import CharacterWheel from "./pages/CharacterWheel";

import { ResultProvider } from "./components/setResult.tsx";

export default function App() {
  return (
    <ResultProvider>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<CharacterWheel />} />
      </Routes>
    </ResultProvider>
  );
}
