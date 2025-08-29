import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig.ts";
import { subraceMap } from "@/Common/Config/SubRaceConfig.ts";
import { Section, WheelStep } from "@/Common/Types/Types.ts";
import React, { useRef, useState, useEffect } from "react";
import arrowImg from "@/assets/Images/Arrow.png";
import { archetypeWheel } from "@/Common/Config/ArchetypeConfig.ts";

export default function CharacterWheel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWheel, setCurrentWheel] = useState<WheelStep>(raceWheel);
  const [results, setResults] = useState<Record<string, string>>({});

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    currentAngle: number,
    sections: Section[]
  ) => {
    const { width, height } = ctx.canvas;
    const radius = Math.min(width, height) / 2 - 20;

    const totalWeight = sections.reduce((sum, sec) => sum + sec.weight, 0);
    let startAngle = 0;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((currentAngle * Math.PI) / 180);

    sections.forEach((section) => {
      const angleStep = (section.weight / totalWeight) * 2 * Math.PI;
      const endAngle = startAngle + angleStep;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = section.color;
      ctx.fill();

      // Label
      ctx.save();
      ctx.fillStyle = "#ffffff"; // chữ trắng
      ctx.strokeStyle = "#000000"; // viền đen
      ctx.lineWidth = 4; // độ dày viền

      ctx.translate(
        Math.cos((startAngle + endAngle) / 2) * radius * 0.65,
        Math.sin((startAngle + endAngle) / 2) * radius * 0.65
      );
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = "center";
      ctx.font = "bold 18px serif";

      // Vẽ viền trước
      ctx.strokeText(section.name, 0, 0);
      // Vẽ chữ sau
      ctx.fillText(section.name, 0, 0);
      ctx.restore();

      startAngle = endAngle;
    });

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, angle, currentWheel.sections);
  }, [angle, currentWheel]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const randomAngle = Math.random() * 360;
    const extraRotations = 5 * 360;
    const finalAngle = angle + extraRotations + randomAngle;

    let start: number | null = null;
    const duration = 3500;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = angle + eased * (finalAngle - angle);
      setAngle(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const landedSection = getResult(finalAngle % 360);
        if (landedSection) {
          const newResults = {
            ...results,
            [currentWheel.key]: landedSection.name,
          };
          setResults(newResults);
          handleNextStep(currentWheel.key, landedSection.name);
        }
        setAngle(finalAngle % 360);
      }
    };

    requestAnimationFrame(animate);
  };

  const getResult = (finalAngle: number) => {
    const normalized = (360 - finalAngle) % 360;

    const totalWeight = currentWheel.sections.reduce(
      (sum, sec) => sum + sec.weight,
      0
    );

    let angleAcc = 0;
    for (const section of currentWheel.sections) {
      const portion = (section.weight / totalWeight) * 360;
      if (normalized >= angleAcc && normalized < angleAcc + portion) {
        return section;
      }
      angleAcc += portion;
    }
    return currentWheel.sections[currentWheel.sections.length - 1];
  };
  const [parentRolls, setParentRolls] = useState<string[]>([]);

  const handleNextStep = (key: string, resultName: string) => {
    if (key === "race") {
      const cfg = raceConfig[resultName];
      if (!cfg) return;

      if (resultName.toLowerCase() === "uma") {
        setCurrentWheel({
          key: "parent",
          title: "Choose Parent",
          sections: subraceMap["parent"],
        });
      } else if (cfg.subrace && subraceMap[resultName]) {
        setCurrentWheel({
          key: "subrace",
          title: cfg.subrace,
          sections: subraceMap[resultName],
        });
      } else {
        // 🔹 race không có subrace → chuyển strength (hoặc trait)
        if (cfg.trait?.toLowerCase() === "vampire") {
          setCurrentWheel({
            key: "trait",
            title: "Trait",
            sections: [
              {
                id: "t1",
                name: "Bloodlust",
                weight: 1,
                color: "#8b0000",
                description: "",
              },
              {
                id: "t2",
                name: "Immortality",
                weight: 1,
                color: "#550000",
                description: "",
              },
            ],
          });
        } else {
          setCurrentWheel(archetypeWheel);
        }
      }
    } else if (key === "parent") {
      const newParents = [...parentRolls, resultName];
      setParentRolls(newParents);

      if (newParents.length === 2) {
        setResults((prev) => ({
          ...prev,
          Parent1: newParents[0],
          Parent2: newParents[1],
          subrace: `${newParents[0]} and ${newParents[1]}`,
        }));

        // Uma xong → strength
        setCurrentWheel(archetypeWheel);
      }
    } else if (key === "subrace") {
      setResults((prev) => ({
        ...prev,
        subrace: resultName,
      }));

      // Subrace xong → trait nếu vampire, ngược lại strength
      if (resultName.toLowerCase() === "vampire") {
        setCurrentWheel({
          key: "trait",
          title: "Trait",
          sections: [
            {
              id: "t1",
              name: "Bloodlust",
              weight: 1,
              color: "#8b0000",
              description: "",
            },
            {
              id: "t2",
              name: "Immortality",
              weight: 1,
              color: "#550000",
              description: "",
            },
          ],
        });
      } else {
        setCurrentWheel(archetypeWheel);
      }
    }
  };

  const resetWheels = () => {
    setTimeout(() => {
      setResults({});
      setCurrentWheel(raceWheel);
      setAngle(0);
    });
  };

  return (
    <div className="w-screen h-screen relative flex flex-col text-amber-200 font-serif">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('./assets/Backgrounds/wheel-bg.png')" }}
      />
      {/* Overlay tối */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="flex flex-1 z-10">
        {/* Left Panel */}
        {/* Left Panel */}
        <div className="w-1/4 flex flex-col gap-6 border-4 border-[#5a2d0c] p-4 rounded-xl shadow-[0_0_30px_rgba(200,50,0,0.8)] bg-black/70">
          <div className="border-4 border-[#d4af37] bg-black/60 h-64 flex items-center justify-center rounded-lg text-amber-200 font-bold text-2xl shadow-[0_0_25px_rgba(255,215,0,0.7)]">
            Hình ảnh nhân vật
          </div>
          <div className="border-2 border-[#d4af37] p-3 text-center rounded-md bg-black/50 text-xl">
            <span className="font-bold tracking-wide">Tên nhân vật</span>
          </div>
          <div className="border-2 border-[#d4af37] p-3 text-center rounded-md bg-black/50 text-xl">
            {results.race || ""} - {results.subrace || ""}
          </div>
          <div className="border-2 border-[#d4af37] p-4 flex flex-col gap-2 rounded-md bg-black/50 text-lg">
            <p className="font-bold underline text-[#f5e6d3] text-xl">
              Archetype
            </p>
            <p>
              ⚔ Strength: <span className="text-red-400">x</span>
            </p>
            <p>
              🏹 Speed: <span className="text-green-400">x</span>
            </p>
            <p>
              🛡 Durability: <span className="text-blue-400">x</span>
            </p>
            <p>
              📜 IQ: <span className="text-purple-300">x</span>
            </p>
            <p>
              🎯 Battle IQ: <span className="text-yellow-300">x</span>
            </p>
            <p>
              🥋 Martial Arts: <span className="text-orange-400">x</span>
            </p>
          </div>
        </div>

        {/* Center Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4 text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)] tracking-widest">
            {currentWheel.title} Wheel
          </h1>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={700}
              height={700}
              className="rounded-full border-4 border-[#8a5b1a] shadow-[0_0_30px_rgba(200,50,50,0.6)] bg-black/40"
            />
            {/* Mũi tên */}
            {/* <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 ">
              <img
                src={arrowImg}
                alt="arrow"
                className="w-20 h-20 object-contain rotate-180"
              />
            </div> */}
            <div className="absolute top-1/2 left-full -translate-y-1/2 ml-[-65px] text-red-500 drop-shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-24 h-24 fill-red-500 rotate-180"
                viewBox="0 0 24 24"
              >
                <path d="M10 17l5-5-5-5v10z" />
              </svg>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-6 mt-6">
            <button
              onClick={spin}
              disabled={isSpinning}
              className="px-8 py-3 bg-gradient-to-b from-[#3a1f1f] to-[#1a0d0d] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow-[0_0_15px_rgba(200,50,50,0.7)] hover:scale-110 transition disabled:opacity-40"
            >
              Roll
            </button>
            <button
              onClick={resetWheels}
              disabled={isSpinning}
              className="px-8 py-3 bg-gradient-to-b from-[#3a1f1f] to-[#1a0d0d] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow-[0_0_15px_rgba(150,50,200,0.7)] hover:scale-110 transition disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/4 flex flex-col gap-6 border-4 border-[#5a2d0c] p-4 rounded-xl shadow-[0_0_30px_rgba(200,50,0,0.8)] bg-black/70">
          <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
            <p className="font-bold underline text-[#f5e6d3]">Weapon</p>
            <div className="flex gap-4 mt-3">
              <div className="border-2 border-gray-500 flex-1 h-28 rounded bg-gray-800/40 shadow-inner"></div>
              <div className="border-2 border-gray-500 flex-1 h-28 rounded bg-gray-800/40 shadow-inner"></div>
            </div>
          </div>
          <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
            <p className="font-bold underline text-[#f5e6d3]">Gear</p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border-2 border-gray-500 h-16 rounded bg-gray-800/40 shadow-inner"
                ></div>
              ))}
            </div>
          </div>
          <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
            <p className="font-bold underline text-[#f5e6d3]">Power</p>
            <ul className="list-disc ml-6 text-amber-300 space-y-2 text-lg">
              <li>🔥 Fire Resistance</li>
              <li>❄ Ice Mastery</li>
              <li>⚡ Thunder Strike</li>
              <li>🌑 Shadow Veil</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
