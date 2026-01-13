import { useNavigate } from "react-router-dom";
import wheelBgImage from "../assets/img/wheel-bg.png";

export const LandingPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Wheel of Name",
      description: "Spin the wheel and let fate decide!",
      icon: "🎡",
      path: "/wheel",
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "Player List",
      description: "Manage your players and their stats",
      icon: "👥",
      path: "/players",
      color: "from-green-500 to-teal-600",
    },
    {
      title: "Battle Zone",
      description: "PvE & PvP battles with stats comparison",
      icon: "⚔️",
      path: "/battle",
      color: "from-red-500 to-orange-600",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">
            Wheel of Multiverse
          </h1>
          <p className="text-gray-300 text-lg md:text-xl">
            Choose your adventure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:border-gray-500 hover:shadow-2xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />
              <div className="relative z-10">
                <div className="text-6xl mb-4">{item.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {item.title}
                </h2>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">V3.0 Lite Edition</p>
        </div>
      </div>
    </div>
  );
};
