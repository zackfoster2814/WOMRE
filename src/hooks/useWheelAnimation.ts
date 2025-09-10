import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { WheelStep, Section } from "@/Common/Types/Types";
import {
  CANVAS_SIZE,
  WHEEL_RADIUS_OFFSET,
  calculateCachedSections,
  getLandedSection,
} from "@/utils/wheelUtils";
import { useZackie } from "@/components/setResult";

export const useWheelAnimation = (
  currentWheel: WheelStep,
  audioRefs?: Record<string, React.RefObject<HTMLAudioElement>>
) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // State
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const {rolledResult,setRolledResult} =useZackie();

  // Memoized calculations
  const cachedSections = useMemo(() => {
    return calculateCachedSections(currentWheel);
  }, [currentWheel]);

  // Drawing functions
  const drawWheelOffscreen = useCallback(() => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas");
      offscreenRef.current.width = CANVAS_SIZE;
      offscreenRef.current.height = CANVAS_SIZE;
    }

    const canvas = offscreenRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const radius = Math.min(width, height) / 2 - WHEEL_RADIUS_OFFSET;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);

    cachedSections.forEach((section) => {
      // Draw section
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, section.startAngle, section.endAngle);
      ctx.closePath();
      ctx.fillStyle = section.color;
      ctx.fill();

      // Draw text
      const midAngle = (section.startAngle + section.endAngle) / 2;
      ctx.save();
      ctx.translate(
        Math.cos(midAngle) * radius * 0.65,
        Math.sin(midAngle) * radius * 0.65
      );
      ctx.rotate(midAngle);
      ctx.textAlign = "center";
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeText(section.name, 0, 0);
      ctx.fillText(section.name, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }, [cachedSections]);

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreenRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(offscreenRef.current, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
  }, []);

  // Effect to redraw when wheel changes
  useEffect(() => {
    drawWheelOffscreen();
    drawWheel(angle);
  }, [drawWheelOffscreen, drawWheel, angle]);

  // Spin function
  const spin = useCallback(() => {
    if (isSpinning || !currentWheel) return;

    setIsSpinning(true);
    setRolledResult(null);

    const duration = 3500 + Math.random() * 2500;
    const spins = 4 + Math.random() * 4;
    const extraDeg = Math.random() * 360;
    const startAngle = angle;
    const totalDeg = spins * 360 + extraDeg;
    const finalAngle = startAngle + totalDeg;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    let startTs: number | null = null;
    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const currentAngle = startAngle + eased * (finalAngle - startAngle);

      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const normalizedAngle = finalAngle % 360;
        setAngle(normalizedAngle);

        const landed = getLandedSection(normalizedAngle, cachedSections);
        console.log(currentWheel);
        setIsSpinning(false);
        const mergeResult = {...currentWheel,...landed};
        setRolledResult(mergeResult);

        // Play audio if available
        if (landed && audioRefs?.[landed.name]) {
          audioRefs[landed.name].current?.play().catch(console.warn);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, currentWheel, angle, cachedSections, audioRefs, drawWheel]);

  // Reset function
  const resetAnimation = useCallback(() => {
    setAngle(0);
    setRolledResult(null);
    setIsSpinning(false);
    drawWheel(0);
  }, [drawWheel]);

  return {
    canvasRef,
    isSpinning,
    angle,
    rolledResult,
    cachedSections,
    spin,
    resetAnimation,
    setRolledResult,
  };
};
