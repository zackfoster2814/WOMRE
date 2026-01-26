import { useEffect, useMemo, useRef, useState } from "react";
import { WheelItem } from "../types";
import { generateColors } from "../utils/colors";
import {
  playTickSound,
  playDefaultWinSound,
  playCustomSound,
} from "../utils/audio";
import { playSpecialSound } from "../utils/specialSounds";
import arrowImg from "../assets/img/arrow.png";
import borderImg from "../assets/img/border.png";
import MouseTracker from "./MouseTracker";
import { EffectRegistry } from "../effects";

interface WheelCanvasProps {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
  customSfxUrl?: string;
  onCurrentItemChange?: (item: WheelItem | null) => void;
  onSpin?: () => void;
  startAngle?: number;
}

export const WheelCanvas = ({
  items,
  isSpinning,
  onSpinComplete,
  customSfxUrl,
  onCurrentItemChange,
  onSpin,
  startAngle = 0,
}: WheelCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();
  const lastItemIndexRef = useRef<number>(-1);
  const wheelCacheRef = useRef<HTMLCanvasElement | null>(null);
  const lastItemsHashRef = useRef<string>("");
  const previousWinningItemRef = useRef<string | null>(null); // Track previous winning item name
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [isMouseInWheelIdle, setIsMouseInWheelIdle] = useState(false);
  const minMouseIdleTimeShowTooltipRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawWheel();

    // Update current item when rotation or startAngle changes
    if (items.length > 0 && onCurrentItemChange) {
      const currentItem = getItemAtAngle(rotation);
      onCurrentItemChange(currentItem);
    }
  }, [items, rotation, startAngle]);

  useEffect(() => {
    if (isSpinning) {
      startSpin();
    }
  }, [isSpinning]);

  const drawStaticWheel = (targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const centerX = targetCanvas.width / 2;
    const centerY = targetCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;

    // Clear with transparent background
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    const activeItems = items.filter(
      (item) => !item.disabled && item.weight > 0,
    );

    if (activeItems.length === 0) {
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        items.length === 0
          ? "Add items to start"
          : "All items disabled or weight = 0",
        centerX,
        centerY,
      );
      return;
    }

    const colors = generateColors(items.length);
    const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
    const reversedItems = [...activeItems].reverse();
    let currentAngle = 0;

    // Draw slices
    reversedItems.forEach((item) => {
      const sliceAngle = (item.weight / totalWeight) * Math.PI * 2;
      const originalIndex = items.findIndex((i) => i.id === item.id);
      const color = item.color || colors[originalIndex % colors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle,
      );
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw borders
    currentAngle = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    reversedItems.forEach((item) => {
      const sliceAngle = (item.weight / totalWeight) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle,
      );
      ctx.closePath();
      ctx.stroke();
      currentAngle += sliceAngle;
    });

    // Draw text

    let fontSize = 16;
    if (activeItems.length > 20) fontSize = 14;
    if (activeItems.length > 40) fontSize = 12;
    if (activeItems.length > 60) fontSize = 10;

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    reversedItems.forEach((item) => {
      const sliceAngle = (item.weight / totalWeight) * Math.PI * 2;
      const sliceWidthAtEdge = radius * sliceAngle;

      if (sliceWidthAtEdge > 15) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle + sliceAngle / 2);

        const maxTextWidth = radius - 30;
        let displayText = item.name;
        let textWidth = ctx.measureText(displayText).width;

        if (textWidth > maxTextWidth) {
          while (textWidth > maxTextWidth - 10 && displayText.length > 3) {
            displayText = displayText.slice(0, -1);
            textWidth = ctx.measureText(displayText + "...").width;
          }
          displayText = displayText + "...";
        }

        // Simplified text drawing - no stroke for better performance
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText(displayText, radius - 20, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      currentAngle += sliceAngle;
    });
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Create hash of items to detect changes
    const itemsHash = JSON.stringify(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        weight: i.weight,
        color: i.color,
        disabled: i.disabled,
      })),
    );

    // Recreate cache if items changed
    if (itemsHash !== lastItemsHashRef.current) {
      if (!wheelCacheRef.current) {
        wheelCacheRef.current = document.createElement("canvas");
        wheelCacheRef.current.width = canvas.width;
        wheelCacheRef.current.height = canvas.height;
      }
      drawStaticWheel(wheelCacheRef.current);
      lastItemsHashRef.current = itemsHash;
    }

    // Clear main canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cached wheel rotated (without startAngle offset - arrow handles that)
    if (wheelCacheRef.current) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(wheelCacheRef.current, 0, 0);
      ctx.restore();
    }

    // Draw center circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const startSpin = () => {
    const spinDuration = 5000 + Math.random() * 3000; // 5-8 seconds
    const extraRotations = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetRotation = extraRotations * 360 + Math.random() * 360;

    const startTime = Date.now();
    const startRotation = rotation;
    lastItemIndexRef.current = -1; // Reset last item index

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function (ease out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + targetRotation * easeOut;
      setRotation(currentRotation % 360);

      // Get current item index to detect when we cross to a new item
      const currentItemIndex = getCurrentItemIndex(currentRotation % 360);

      // Only play tick sound when we move to a different item
      if (
        currentItemIndex !== lastItemIndexRef.current &&
        currentItemIndex !== -1
      ) {
        playTickSound();
        lastItemIndexRef.current = currentItemIndex;
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const finalRotation = currentRotation % 360;
        const winningItem = getItemAtAngle(finalRotation);

        // Play result sound - check special sounds first, then custom sounds, then default
        const hasSpecialSound = playSpecialSound(
          winningItem.name,
          items.length,
          previousWinningItemRef.current,
        );

        if (!hasSpecialSound) {
          if (winningItem.customSound) {
            playCustomSound(winningItem.customSound);
          } else if (customSfxUrl) {
            playCustomSound(customSfxUrl);
          } else {
            playDefaultWinSound();
          }
        }

        // Update previous winning item for next spin
        previousWinningItemRef.current = winningItem.name;

        onSpinComplete(winningItem);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animate();
  };

  const getCurrentItemIndex = (angle: number): number => {
    const activeItems = items.filter(
      (item) => !item.disabled && item.weight > 0,
    );
    if (activeItems.length === 0) return -1;

    const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
    // Pointer angle is now dynamic based on startAngle
    // When startAngle = 0, pointer is at 270 degrees (top)
    // The pointer rotates opposite to startAngle
    const pointerAngle = (270 + startAngle) % 360;
    const adjustedAngle = (pointerAngle - angle + 360) % 360;

    let currentAngle = 0;
    const reversedItems = [...activeItems].reverse();

    for (let i = 0; i < reversedItems.length; i++) {
      const sliceAngle = (reversedItems[i].weight / totalWeight) * 360;
      currentAngle += sliceAngle;

      if (adjustedAngle < currentAngle) {
        // Return the index in the active items array
        return activeItems.length - 1 - i;
      }
    }

    return activeItems.length - 1;
  };

  const getItemAtAngle = (angle: number): WheelItem => {
    const activeItems = items.filter(
      (item) => !item.disabled && item.weight > 0,
    );
    const index = getCurrentItemIndex(angle);
    return activeItems[index] || activeItems[0];
  };

  const isPosInWheel = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const radius = rect.width / 2;

    return distance <= radius;
  };

  const calculateAngleFromPos = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = ((angle + 360 + 90 - startAngle - rotation) % 360) * -1;

    return angle;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPosInWheel(e.clientX, e.clientY)) {
      setHoveredItemIndex(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const index = getCurrentItemIndex(
      calculateAngleFromPos(e.clientX, e.clientY),
    );

    setHoveredItemIndex(index);

    setIsMouseInWheelIdle(false);

    if (minMouseIdleTimeShowTooltipRef.current)
      clearTimeout(minMouseIdleTimeShowTooltipRef.current);

    minMouseIdleTimeShowTooltipRef.current = setTimeout(() => {
      setIsMouseInWheelIdle(true);
    }, 500);
  };

  const activeItems = items.filter((item) => !item.disabled && item.weight > 0);
  const canSpin = activeItems.length > 0 && !isSpinning;

  const description = useMemo(() => {
    if (hoveredItemIndex === null) return null;

    const item = activeItems[hoveredItemIndex];

    const searchResults = EffectRegistry.search(item?.name);

    if (searchResults.length) return searchResults[0].description;

    return item?.effectDescription;
  }, [hoveredItemIndex]);

  return (
    <div className="relative inline-block w-full" style={{ padding: "3%" }}>
      {/* Border Overlay - positioned absolutely to cover the padded area */}
      <img
        src={borderImg}
        alt="Wheel Border"
        className="absolute pointer-events-none"
        style={{
          zIndex: 5,
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Canvas container with relative positioning */}
      <div className="relative group" style={{ margin: "0 auto", maxWidth: "800px" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="w-full block"
          style={{ backgroundColor: "transparent" }}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredItemIndex(null)}
        />
        {!isSpinning && hoveredItemIndex !== null && description && (
          <MouseTracker offset={{ x: 15, y: 15 }}>
            <svg
              className={`w-6 h-6 -rotate-90 ${isMouseInWheelIdle ? "animate-[fade-out_1s_forwards]" : "hidden"}`}
              viewBox="0 0 120 120"
            >
              <circle
                className="text-gray-300 stroke-current"
                strokeWidth="24"
                cx="60"
                cy="60"
                r="48"
                fill="transparent"
              />
              <circle
                className="text-blue-600 stroke-current animate-[draw-circle_1.5s]"
                strokeWidth="24"
                strokeDasharray="360"
                strokeDashoffset="0"
                strokeLinecap="round"
                cx="60"
                cy="60"
                r="48"
                fill="transparent"
              />
            </svg>
            {isMouseInWheelIdle && (
              <div className="bg-black bg-opacity-75 text-white text-xl rounded-md px-4 py-2 pointer-events-auto max-w-lg whitespace-pre-line opacity-0 animate-[fade-in_0s_1s_forwards]">
                {description}
              </div>
            )}
          </MouseTracker>
        )}

        {/* Arrow Pointer - rotates around wheel center (skull center) */}
        <img
          src={arrowImg}
          alt="Pointer"
          className="absolute pointer-events-none"
          style={{
            zIndex: 15,
            top: "48.4%",
            left: "50%",
            width: "18%",
            height: "auto",
            transform: `translate(-50%, -50%) rotate(${startAngle}deg)`,
            transformOrigin: "50% calc(49.5% + 11.5px)",
          }}
        />

        {/* Spin Button Overlay */}
        <button
          onClick={onSpin}
          disabled={!canSpin}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-2xl shadow-2xl transition-all transform hover:scale-110 disabled:scale-100 disabled:cursor-not-allowed border-4 border-white"
          style={{ zIndex: 10 }}
        >
          {isSpinning ? "..." : "SPIN"}
        </button>
      </div>
    </div>
  );
};
