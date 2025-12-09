import { useNavigate } from "react-router-dom";
import menuBg from "../assets/Backgrounds/menu-bg.jpg";

export default function BattleMode() {
  const navigate = useNavigate();

  const handleModeSelect = (mode: string) => {
    if (mode === "pve") {
      navigate("/battle/pve");
    } else if (mode === "pvp") {
      navigate("/battle/pvp");
    }
  };

  const cardStyle =
    "w-96 h-72 rounded-3xl font-bold text-2xl text-white shadow-2xl " +
    "hover:scale-105 transition-all duration-300 cursor-pointer " +
    "bg-gradient-to-br border-4 " +
    "hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] " +
    "active:scale-95 backdrop-blur-md flex flex-col items-center justify-center gap-6";

  return (
    <div className="w-screen h-screen relative flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-purple-950/50 to-black/90" />

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 px-6 py-3 rounded-xl font-bold text-white bg-purple-900/80 border-2 border-purple-500/40 hover:scale-105 transition-all z-20"
      >
        ← BACK
      </button>

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-12">
        {/* Title */}
        <h1 className="text-6xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,100,100,0.8)] mb-8">
          CHỌN LOẠI THI ĐẤU
        </h1>

        {/* Mode Cards */}
        <div className="flex gap-12">
          {/* PvE Card */}
          <div
            onClick={() => handleModeSelect("pve")}
            className={`${cardStyle} from-green-900/80 via-emerald-950/80 to-teal-950/80 border-green-500/40 hover:border-green-400 group`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-3xl" />
            <span className="text-7xl relative">🐉</span>
            <span className="relative text-4xl font-black tracking-wider">PvE</span>
            <span className="relative text-sm opacity-70 text-center px-6">
              Vòng loại - Đấu với quái vật
              <br />
              So sánh chỉ số & kích hoạt buff
            </span>
          </div>

          {/* PvP Card */}
          <div
            onClick={() => handleModeSelect("pvp")}
            className={`${cardStyle} from-red-900/80 via-rose-950/80 to-pink-950/80 border-red-500/40 hover:border-red-400 group`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-3xl" />
            <span className="text-7xl relative">⚔️</span>
            <span className="relative text-4xl font-black tracking-wider">PvP</span>
            <span className="relative text-sm opacity-70 text-center px-6">
              Vòng thi đấu - Đấu với người chơi
              <br />
              Quay vòng may mắn & buff/debuff
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 max-w-3xl text-center">
          <p className="text-purple-300/70 text-sm tracking-wide">
            PvE: Chiến đấu dựa trên so sánh chỉ số tổng hợp sau khi tính buff, power và các yếu tố khác
          </p>
          <p className="text-purple-300/70 text-sm tracking-wide mt-2">
            PvP: Chiến đấu dựa trên may mắn, quay vòng quay để xem ai chiến thắng sau khi tính toán buff/debuff
          </p>
        </div>
      </div>
    </div>
  );
}
