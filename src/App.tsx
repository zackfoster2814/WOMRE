import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Menu from "./pages/Menu.tsx";
import CharacterWheel from "./pages/CharacterWheel.tsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<CharacterWheel />} />
      </Routes>
    </Router>
  );
}
