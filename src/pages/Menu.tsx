import React from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();

  const handleClick = (action: string) => {
    console.log(`Clicked: ${action}`);
    if (action === "exit") {
      window.close(); // thoát app electron
    }
    if (action === "start") {
      navigate("/wheel"); // chuyển sang trang vòng quay
    }
  };

  const btnStyle =
    "w-32 h-12 p-3 border-4 rounded-lg font-bold text-white shadow-md transition-transform transform hover:scale-110";

  return (
    <div
      className="w-screen h-screen bg-cover bg-center flex flex-col justify-center items-start pl-10 gap-4"
      style={{ backgroundImage: "url('./assets/bg.png')" }}
    >
      <button
        onClick={() => handleClick("start")}
        className={`${btnStyle} border-blue-400 bg-blue-500 hover:bg-blue-600`}
      >
        Start
      </button>

      <button
        onClick={() => handleClick("data")}
        className={`${btnStyle} border-green-400 bg-green-500 hover:bg-green-600`}
      >
        Data
      </button>

      <button
        onClick={() => handleClick("setting")}
        className={`${btnStyle} border-yellow-400 bg-yellow-500 hover:bg-yellow-600`}
      >
        Setting
      </button>

      <button
        onClick={() => handleClick("exit")}
        className={`${btnStyle} border-red-400 bg-red-500 hover:bg-red-600`}
      >
        Exit
      </button>
    </div>
  );
}
