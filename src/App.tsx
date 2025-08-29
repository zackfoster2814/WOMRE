import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Wheel from "./pages/Wheel";

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
