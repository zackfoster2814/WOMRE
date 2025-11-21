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
  };

  const btnStyle =
    "w-64 h-16 rounded-xl font-bold text-lg text-gray-200 shadow-[0_0_15px_rgba(128,0,128,0.6)] " +
    "hover:scale-110 transition-transform bg-gradient-to-b from-[#2b1d42] to-[#1a1029] " +
    "border border-[#8a5b1a] hover:shadow-[0_0_25px_rgba(200,50,50,0.8)]";

  const disabledStyle =
    "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none";

  return (
    <div className="w-screen h-screen relative flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
        }}
      />

      {/* Overlay u ám */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sidebar menu */}
      <div className="flex flex-col justify-center items-center gap-6 ml-10 z-10">
        <button onClick={() => handleClick("start")} className={btnStyle}>
          START
        </button>
        <button
          onClick={() => handleClick("setting", true)}
          className={`${btnStyle} ${disabledStyle}`}
        >
          SETTING
        </button>
        <button
          onClick={() => handleClick("data")}
          className={btnStyle}
        >
          DATA
        </button>
        <button onClick={() => handleClick("exit")} className={btnStyle}>
          EXIT
        </button>
      </div>

      {/* Title */}
      <div className="flex-1 flex flex-col justify-center items-center ml-16 z-10">
        <h1 className="text-7xl font-black mb-2 text-[#d4af37] drop-shadow-[0_0_20px_rgba(255,180,50,0.8)] tracking-widest">
          Wheel
        </h1>
        <h1 className="text-7xl font-black mb-2 text-[#d4af37] drop-shadow-[0_0_20px_rgba(255,180,50,0.8)] tracking-widest">
          of
        </h1>
        <h1 className="text-7xl font-black mb-6 text-[#d4af37] drop-shadow-[0_0_20px_rgba(255,180,50,0.8)] tracking-widest">
          Multiverse
        </h1>
        <span className="text-2xl font-semibold text-purple-400 drop-shadow-[0_0_15px_rgba(150,50,200,0.9)]">
          V2.36
        </span>
      </div>
    </div>
  );
}
