import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent F5 refresh, but allow Ctrl+Shift+R
window.addEventListener("keydown", (e) => {
  if (e.key === "F5" && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
