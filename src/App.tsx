import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ZackieProvider } from "./components/setResult.tsx";
import Wheel from "./pages/Wheel.tsx";
import Menu from "./pages/Menu.tsx";
import CharacterWheel from "./pages/CharacterWheel.tsx";

export default function App() {
  return (
    <Router>
    <ZackieProvider>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<CharacterWheel />} />
      </Routes>
    </ZackieProvider>
    </Router>
  );
}
