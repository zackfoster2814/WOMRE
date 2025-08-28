import React, { useRef, useState, useEffect } from "react";

const sections = [
  { id: "01", name: "Goblin", weight: 5, color: "#CC4C4C" },
  { id: "02", name: "Gnome", weight: 5, color: "#E6A857" },
  { id: "03", name: "Human", weight: 5, color: "#E6E68A" },
  { id: "04", name: "Dwarf", weight: 5, color: "#5FAF5F" },
  { id: "05", name: "Merfolk", weight: 4, color: "#80D4D4" },
];

export default function Wheel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const radius = 200;

  useEffect(() => {
    rollSoundRef.current = new Audio("/assets/no-story-70330.mp3");
  }, []);

  const drawWheel = (ctx: CanvasRenderingContext2D, currentAngle: number) => {
    const totalWeight = sections.reduce((sum, sec) => sum + sec.weight, 0);
    let startAngle = 0;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate((currentAngle * Math.PI) / 180);

    sections.forEach((section) => {
      const angleStep = (section.weight / totalWeight) * 2 * Math.PI;
      const endAngle = startAngle + angleStep;

      // fill sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = section.color;
      ctx.fill();

      // text
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.translate(
        Math.cos((startAngle + endAngle) / 2) * radius * 0.6,
        Math.sin((startAngle + endAngle) / 2) * radius * 0.6
      );
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = "center";
      ctx.font = "16px Arial";
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
    drawWheel(ctx, angle);
  }, [angle]);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    const randomAngle = Math.random() * 360;
    const extraRotations = 5 * 360;
    const finalAngle = angle + extraRotations + randomAngle;

    let start: number | null = null;
    const duration = 3500 + Math.random() * 2000; // 3.5 → 5.5 s
    let lastSectionIndex = -1;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // quartOut easing
      const current = angle + eased * (finalAngle - angle);
      setAngle(current);

      // phát âm thanh khi qua section mới
      const totalWeight = sections.reduce((s, sec) => s + sec.weight, 0);
      let cumulative = 0;
      const normalizedAngle = (360 - (current % 360)) % 360;
      let currentSectionIndex = -1;
      for (let i = 0; i < sections.length; i++) {
        const step = (sections[i].weight / totalWeight) * 360;
        cumulative += step;
        if (normalizedAngle <= cumulative) {
          currentSectionIndex = i;
          break;
        }
      }
      if (
        currentSectionIndex !== -1 &&
        currentSectionIndex !== lastSectionIndex
      ) {
        rollSoundRef.current?.play();
        lastSectionIndex = currentSectionIndex;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // xác định kết quả
        let chosen: string | null = null;
        cumulative = 0;
        for (const section of sections) {
          const step = (section.weight / totalWeight) * 360;
          cumulative += step;
          if (normalizedAngle <= cumulative) {
            chosen = section.name;
            break;
          }
        }
        setResult(chosen);
        setIsSpinning(false);
        setAngle(finalAngle % 360);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-6">
      <canvas ref={canvasRef} width={500} height={500} />
      <button
        onClick={spin}
        disabled={isSpinning}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold shadow-lg disabled:opacity-50"
      >
        {isSpinning ? "Spinning..." : "Spin"}
      </button>
      {result && (
        <div className="text-2xl font-bold text-orange-400">
          Result: {result}
        </div>
      )}
    </div>
  );
}
