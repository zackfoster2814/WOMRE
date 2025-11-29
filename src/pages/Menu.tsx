import React from "react";
import { useNavigate } from "react-router-dom";
import menuBg from "../assets/Backgrounds/menu-bg.jpg";

export default function Menu() {
  const navigate = useNavigate();

  const handleClick = (action: string, disabled?: boolean) => {
    if (disabled) {
      alert("Chức năng đang cập nhật!");
      return;
    }
    if (action === "exit") {
      window.close();
    }
    if (action === "start") {
      navigate("/wheel");
    }
    if (action === "data") {
      navigate("/data");
    }
    if (action === "battle") {
      navigate("/battle");
    }
  };

  const btnStyle =
    "w-72 h-20 rounded-2xl font-bold text-xl text-white shadow-lg " +
    "hover:scale-105 transition-all duration-300 " +
    "bg-gradient-to-br from-purple-900/80 via-purple-950/80 to-indigo-950/80 " +
    "border-2 border-purple-500/40 " +
    "hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] " +
    "active:scale-95 backdrop-blur-md";

  const disabledStyle =
    "opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-lg grayscale";

  return (
    <div className="w-screen h-screen relative flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
        }}
      />

      {/* Overlay u ám với gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-purple-950/50 to-black/90" />

      {/* Animated particles effect */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping top-1/4 left-1/4" />
        <div className="absolute w-2 h-2 bg-blue-400 rounded-full animate-pulse top-3/4 left-1/3" />
        <div className="absolute w-2 h-2 bg-pink-400 rounded-full animate-bounce top-1/2 right-1/4" />
      </div>

      {/* Sidebar menu */}
      <div className="flex flex-col justify-center items-start gap-5 ml-20 z-10">
        <button
          onClick={() => handleClick("start")}
          className={`${btnStyle} group relative overflow-hidden`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          <span className="relative flex items-center justify-between px-6">
            <span>▶</span>
            <span className="flex-1">START</span>
            <span className="opacity-50">▶</span>
          </span>
        </button>
        <button
          onClick={() => handleClick("setting", true)}
          className={`${btnStyle} ${disabledStyle} relative overflow-hidden`}
        >
          <span className="flex items-center justify-between px-6">
            <span>⚙</span>
            <span className="flex-1">SETTING</span>
            <span className="opacity-50">🔒</span>
          </span>
        </button>
        <button
          onClick={() => handleClick("data")}
          className={`${btnStyle} group relative overflow-hidden`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          <span className="relative flex items-center justify-between px-6">
            <span>📊</span>
            <span className="flex-1">DATA</span>
            <span className="opacity-50">→</span>
          </span>
        </button>
        <button
          onClick={() => handleClick("battle")}
          className={`${btnStyle} group relative overflow-hidden`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          <span className="relative flex items-center justify-between px-6">
            <span>⚔️</span>
            <span className="flex-1">BATTLE</span>
            <span className="opacity-50">⚔️</span>
          </span>
        </button>
        <button
          onClick={() => handleClick("exit")}
          className={`${btnStyle} group relative overflow-hidden hover:from-red-600 hover:via-red-700 hover:to-red-800`}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-30 transition-opacity" />
          <span className="relative flex items-center justify-between px-6">
            <span>✕</span>
            <span className="flex-1">EXIT</span>
            <span className="opacity-50">✕</span>
          </span>
        </button>
      </div>

      {/* Title */}
      <div className="flex-1 flex flex-col justify-center items-center ml-16 z-10">
        <div className="relative mb-8">
          {/* Glow effect behind text */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 opacity-30 animate-pulse" />

          <div className="relative">
            <h1 className="text-8xl font-black mb-3 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] tracking-wider animate-pulse">
              Wheel
            </h1>
            <h1 className="text-7xl font-black mb-3 bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] tracking-wider">
              of
            </h1>
            <h1 className="text-8xl font-black mb-8 bg-gradient-to-r from-blue-300 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(147,51,234,0.8)] tracking-wider animate-pulse">
              Multiverse
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/30">
          <span className="text-xs font-semibold text-purple-300 tracking-widest">SEASON</span>
          <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]">
            3
          </span>
        </div>

        {/* Subtitle */}
        <p className="mt-6 text-sm text-purple-300/70 tracking-[0.3em] uppercase font-light">
          Character Creation System
        </p>
      </div>
    </div>
  );
}
