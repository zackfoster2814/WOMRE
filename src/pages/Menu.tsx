import React from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();

  const handleClick = (action: string) => {
    console.log(`Clicked: ${action}`);
    if (action === "exit") {
      window.close();
    }
    if (action === "start") {
      navigate("/wheel");
    }
  };

  const btnStyle =
    "w-60 h-16 rounded-2xl font-bold text-white text-xl shadow-lg hover:scale-110 transition-transform bg-gradient-to-br from-purple-600 to-indigo-500 border-2 border-yellow-300";

  return (
    <div
      className="w-screen h-screen bg-cover flex items-center justify-center"
      style={{ backgroundImage: "url('./assets/bg.jpg')" }}
    >
      {/* Sidebar menu */}
      <div className="flex flex-col justify-center items-center gap-6">
        <button onClick={() => handleClick("start")} className={btnStyle}>
          START
        </button>

        <button onClick={() => handleClick("setting")} className={btnStyle}>
          SETTING
        </button>

        <button onClick={() => handleClick("data")} className={btnStyle}>
          DATA
        </button>

        <button onClick={() => handleClick("exit")} className={btnStyle}>
          EXIT
        </button>
      </div>

      {/* Right side: title */}
      <div className="flex-1 flex flex-col justify-center items-center ml-16">
        <h1 className="text-7xl font-handwriting mb-2 text-yellow-200 drop-shadow-lg">
          Wheel
        </h1>
        <h1 className="text-7xl font-handwriting mb-2 text-yellow-200 drop-shadow-lg">
          of
        </h1>
        <h1 className="text-7xl font-handwriting mb-4 text-yellow-200 drop-shadow-lg">
          Multiverse
        </h1>
        <span className="text-3xl font-handwriting text-purple-300 drop-shadow-md">
          V2.36
        </span>
      </div>
    </div>
  );
}
