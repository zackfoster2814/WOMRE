import React, { useRef, useState, useEffect } from "react";

interface Section {
  id: string;
  name: string;
  weight: number;
  color: string;
}

interface SubRace {
  id: string;
  name: string;
  weight: number;
  color: string;
  description?: string;
  trait?: string;
}

interface Result {
  main?: string;
  troll?: { id: string; description: string };
  elf?: { id: string; trait: string };
}

const sections: Section[] = [
  { id: "01", name: "Goblin", weight: 5, color: "#CC4C4C" },
  { id: "02", name: "Gnome", weight: 5, color: "#E6A857" },
  { id: "03", name: "Human", weight: 5, color: "#E6E68A" },
  { id: "04", name: "Dwarf", weight: 5, color: "#5FAF5F" },
  { id: "05", name: "Merfolk", weight: 4, color: "#80D4D4" },
];

const subRaces: { Troll: SubRace[]; Elf: SubRace[] } = {
  Troll: [
    { id: "T01", name: "Regular Troll", weight: 42, color: "#8B0000", description: "Một con Troll thường 💀" },
    { id: "T02", name: "Ice Troll", weight: 30, color: "#4682B4", description: "Trong combat: Đối thủ -1 Spd" },
    { id: "T03", name: "Mountain Troll", weight: 25, color: "#696969", description: "Nhận +1 Dura" },
    { id: "T04", name: "Lich Troll", weight: 3, color: "#2F4F4F", description: "Nhận 1 Power của player đã chết sau mỗi trận đấu." },
  ],
  Elf: [
    { id: "E01", name: "High Elf", weight: 9, color: "#FFD700", trait: "Nhận +2 Base IQ." },
    { id: "E02", name: "Dark Elf", weight: 8, color: "#4B0082", trait: "Nhận +2 Base BIQ." },
    { id: "E03", name: "Wood Elf", weight: 20, color: "#228B22", trait: "Nhận 1 random Power và +1 BIQ" },
    { id: "E04", name: "Sea Elf", weight: 14, color: "#00CED1", trait: "Nhận 1 random Power và +1 Dura" },
    { id: "E05", name: "Moon Elf", weight: 14, color: "#B0C4DE", trait: 'Nhận 1 random Power và Quay 1 "Lover"' },
    { id: "E06", name: "Sun Elf", weight: 14, color: "#FFA500", trait: "Nhận 1 random Power và +1 MA" },
    { id: "E07", name: "Star Elf", weight: 14, color: "#F8F8FF", trait: "Nhận 1 random Power và +1 Speed" },
    { id: "E08", name: "Lythari", weight: 7, color: "#DAA520", trait: 'Nhận +3 Base Speed và Quirk "Raconteur"' },
  ],
};

const Wheel: React.FC = () => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trollCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const elfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const [angles, setAngles] = useState({ main: 0, troll: 0, elf: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    window.api.fetchAllPlayers().then(setPlayers);
    console.log(players)  ;
  }, []);
  const radius = 150;

  useEffect(() => {
    rollSoundRef.current = new Audio("/assets/no-story-70330.mp3");
  }, []);

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    items: (Section | SubRace)[],
    currentAngle: number
  ) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = 0;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate((currentAngle * Math.PI) / 180);

    items.forEach((item) => {
      const angleStep = (item.weight / totalWeight) * 2 * Math.PI;
      const endAngle = startAngle + angleStep;

      // Draw sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Draw text
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.translate(
        Math.cos((startAngle + endAngle) / 2) * radius * 0.6,
        Math.sin((startAngle + endAngle) / 2) * radius * 0.6
      );
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = "center";
      ctx.font = "14px Arial";
      ctx.fillText(item.name, 0, 0);
      ctx.restore();

      startAngle = endAngle;
    });

    ctx.restore();
  };

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const trollCanvas = trollCanvasRef.current;
    const elfCanvas = elfCanvasRef.current;

    if (mainCanvas) {
      const ctx = mainCanvas.getContext("2d");
      if (ctx) drawWheel(ctx, sections, angles.main);
    }
    if (trollCanvas) {
      const ctx = trollCanvas.getContext("2d");
      if (ctx) drawWheel(ctx, subRaces.Troll, angles.troll);
    }
    if (elfCanvas) {
      const ctx = elfCanvas.getContext("2d");
      if (ctx) drawWheel(ctx, subRaces.Elf, angles.elf);
    }
  }, [angles]);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    const randomAngles = {
      main: Math.random() * 360,
      troll: Math.random() * 360,
      elf: Math.random() * 360,
    };
    const extraRotations = 5 * 360;
    const finalAngles = {
      main: angles.main + extraRotations + randomAngles.main,
      troll: angles.troll + extraRotations + randomAngles.troll,
      elf: angles.elf + extraRotations + randomAngles.elf,
    };
    let start: number | null = null;
    const duration = 3500 + Math.random() * 2000;

    const lastSectionIndices = { main: -1, troll: -1, elf: -1 };

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAngles({
        main: angles.main + eased * (finalAngles.main - angles.main),
        troll: angles.troll + eased * (finalAngles.troll - angles.troll),
        elf: angles.elf + eased * (finalAngles.elf - angles.elf),
      });

      // Play sound on section change
      const checkSectionChange = (
        items: (Section | SubRace)[],
        angle: number,
        lastIndex: number,
        wheel: keyof typeof lastSectionIndices
      ) => {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        const normalizedAngle = (360 - (angle % 360)) % 360;
        let cumulative = 0;
        let currentIndex = -1;
        for (let i = 0; i < items.length; i++) {
          const step = (items[i].weight / totalWeight) * 360;
          cumulative += step;
          if (normalizedAngle <= cumulative) {
            currentIndex = i;
            break;
          }
        }
        if (currentIndex !== -1 && currentIndex !== lastIndex) {
          rollSoundRef.current?.play();
          lastSectionIndices[wheel] = currentIndex;
        }
        return currentIndex;
      };

      checkSectionChange(sections, angles.main, lastSectionIndices.main, "main");
      checkSectionChange(subRaces.Troll, angles.troll, lastSectionIndices.troll, "troll");
      checkSectionChange(subRaces.Elf, angles.elf, lastSectionIndices.elf, "elf");

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Determine results
        const getResult = (items: (Section | SubRace)[], angle: number) => {
          const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
          const normalizedAngle = (360 - (angle % 360)) % 360;
          let cumulative = 0;
          for (const item of items) {
            const step = (item.weight / totalWeight) * 360;
            cumulative += step;
            if (normalizedAngle <= cumulative) {
              return item;
            }
          }
          return null;
        };

        const mainResult = getResult(sections, finalAngles.main);
        const trollResult = getResult(subRaces.Troll, finalAngles.troll) as SubRace;
        const elfResult = getResult(subRaces.Elf, finalAngles.elf) as SubRace;

        setResult({
          main: mainResult?.name,
          troll: trollResult ? { id: trollResult.id, description: trollResult.description! } : undefined,
          elf: elfResult ? { id: elfResult.id, trait: elfResult.trait! } : undefined,
        });
        setIsSpinning(false);
        setAngles({
          main: finalAngles.main % 360,
          troll: finalAngles.troll % 360,
          elf: finalAngles.elf % 360,
        });
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-6">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Main Wheel</h2>
          <canvas ref={mainCanvasRef} width={350} height={350} />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Troll Sub-Race</h2>
          <canvas ref={trollCanvasRef} width={350} height={350} />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Elf Sub-Race</h2>
          <canvas ref={elfCanvasRef} width={350} height={350} />
        </div>
      </div>
      <button
        onClick={spin}
        disabled={isSpinning}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold shadow-lg disabled:opacity-50"
      >
        {isSpinning ? "Spinning..." : "Spin All"}
      </button>
      {result && (
        <div className="text-lg font-bold text-orange-400 text-center">
          <p>Main: {result.main || "N/A"}</p>
          <p>
            Troll: {result.troll?.id || "N/A"} - {result.troll?.description || "N/A"}
          </p>
          <p>
            Elf: {result.elf?.id || "N/A"} - {result.elf?.trait || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Wheel;