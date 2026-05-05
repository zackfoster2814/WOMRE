import { useEffect, useState, useMemo } from "react";
import { PvPPlayerData } from "../../types/battleZone";

const avatarPaths = import.meta.glob('/public/data/avatars/no*.*');
const validAvatarMap = new Map<number, string>();
Object.keys(avatarPaths).forEach((path) => {
  const match = path.match(/\/no(\d+)\.([a-zA-Z0-9]+)$/);
  if (match) {
    validAvatarMap.set(parseInt(match[1], 10), match[2]);
  }
});

interface Props {
  allPlayers: PvPPlayerData[];
  player1No: number;
  player2No: number;
  onComplete: () => void;
  volume?: number;
}

export function ChampionshipIntroScreen({
  allPlayers,
  player1No,
  player2No,
  onComplete,
  volume = 1,
}: Props) {
  const [phase, setPhase] = useState<"enter" | "slide" | "flash">("enter");
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const eligiblePlayers = useMemo(() => {
    // Lấy tất cả player có data character và có avatar, trừ 2 player chung kết
    const list = allPlayers.filter(
      (p) =>
        p.no !== player1No &&
        p.no !== player2No &&
        p.character &&
        validAvatarMap.has(p.no)
    );
    // Sắp xếp theo thứ tự SBD (no)
    return list.sort((a, b) => a.no - b.no);
  }, [allPlayers, player1No, player2No]);

  // Chia làm 4 cột để tránh bị lẻ hoặc theo yêu cầu
  const columns = 4;
  const rowsCount = Math.ceil(eligiblePlayers.length / columns);

  // Tính thời gian scroll: 4s để đi qua màn hình + 1.2s cho mỗi hàng (chậm hơn)
  const scrollDuration = 4 + rowsCount * 1.2;

  useEffect(() => {
    if (eligiblePlayers.length === 0) {
      onComplete();
      return;
    }

    // Tạm thời tắt âm thanh theo yêu cầu
    // const audio = new Audio(`${basePath}/assets/combatSFX/startcombat.mp3`);
    // audio.volume = Math.max(0, Math.min(1, volume));
    // audio.play().catch(() => {});

    const t1 = setTimeout(() => {
      setPhase("slide");
    }, 500);

    return () => clearTimeout(t1);
  }, [eligiblePlayers, basePath, volume, onComplete]);

  // Dùng onAnimationEnd trên element để báo kết thúc, không dùng setTimeout ảo nữa

  if (eligiblePlayers.length === 0) return null;

  const renderCard = (p: PvPPlayerData) => {
    const ext = validAvatarMap.get(p.no);
    const src = `${basePath}/data/avatars/no${p.no}.${ext}`;
    return (
      <div
        key={p.no}
        className="flex flex-col items-center transform transition-transform duration-500 hover:scale-105"
      >
        <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-lg overflow-hidden border-2 border-amber-500/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] bg-black">
          <img
            src={src}
            alt={p.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
          <div className="absolute bottom-2 left-0 right-0 text-center px-1 md:px-2">
            <div className="text-amber-500 font-serif text-[10px] md:text-xs uppercase tracking-widest drop-shadow-md">
              Player #{p.no}
            </div>
            <div className="text-white font-black font-display text-xs md:text-base truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              {p.name}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9995] bg-[#050505] overflow-hidden flex flex-col items-center justify-center pointer-events-none">
      {/* Background Cinematic */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black transition-opacity duration-1000"
        style={{ opacity: phase === "flash" ? 0 : 1 }}
      />

      {/* Title Background mờ ảo */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000"
        style={{ opacity: phase === "flash" ? 0 : 0.1 }}
      >
        <div className="text-[15vw] font-black text-amber-500 font-serif leading-none text-center mix-blend-screen" style={{ WebkitTextStroke: '2px rgba(255,215,0,0.5)', color: 'transparent' }}>
          CHAMPIONSHIP
        </div>
      </div>

      <style>{`
        @keyframes verticalScroll {
          0% { transform: translateY(100vh); }
          100% { transform: translateY(-100%); }
        }
      `}</style>

      {phase === "slide" && (
        <div
          className="absolute top-0 left-0 right-0 w-full"
          style={{
            animation: `verticalScroll ${scrollDuration}s linear forwards`
          }}
          onAnimationEnd={() => {
            // Khi slide cuộn hết, chuyển phase thành flash (bây giờ sẽ là màn hình đen)
            setPhase("flash");
            // Đợi 1 giây đen màn hình rồi gọi onComplete để mở intro trận
            setTimeout(onComplete, 1000);
          }}
        >
          <div className="grid grid-cols-4 gap-4 md:gap-8 px-4 md:px-8 max-w-[1200px] mx-auto w-full pt-16">
            {eligiblePlayers.map(renderCard)}
          </div>
        </div>
      )}

      {/* Lớp gradient đen che hai đầu trên dưới để tạo hiệu ứng mờ dần */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505] to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-10" />

      {/* Màn hình đen chuyển cảnh */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: phase === "flash" ? 1 : 0,
          transition: "opacity 0.5s ease-in",
          zIndex: 20
        }}
      />
    </div>
  );
}
