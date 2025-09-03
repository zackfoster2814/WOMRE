import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Wheel from "./pages/Wheel.tsx";
import Menu from "./pages/Menu.tsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/wheel" element={<Wheel />} />
      </Routes>
    </Router>
  );
}
