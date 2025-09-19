import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  ButtonHTMLAttributes,
} from "react";
import wheelBorder from "@/assets/images/wheel-border.png";
import arrow from "@/assets/Images/arrow-2.png";
import indexChangeSoundEffect from "@/assets/audio/slot-machine.mp3";
import { Section } from "@/Common/Types/Types";
import { COLOR_PALETTE } from "@/Common/Constants/ConstantsConfig";

interface WheelProps {
  items: Section[];
  width: number;
  height: number;
  onClick?: () => void;
  onStartSpin?: () => void;
  onRest?: (index: number) => void;
  onMouseEnter?: (index: number) => void;
  onMouseLeave?: () => void;
  onCurrentIndexChange?: (index: number) => void;
  handleNext?: () => void;
  title: string;
}

const Wheel: React.FC<WheelProps> = React.memo(
  ({
    items,
    width,
    height,
    onClick,
    onStartSpin,
    onRest,
    onMouseEnter,
    onMouseLeave,
    onCurrentIndexChange,
    handleNext,
    title,
  }) => {
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [isSpined, setIsSpined] = useState<boolean>(false);
    const [result, setResult] = useState<number | null>(null);
    const [rotation, setRotation] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [showResetDialog, setShowResetDialog] = useState(false);

    const wheelRef = useRef<SVGSVGElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastSegmentIndexRef = useRef<number | null>(null);

    const radius = Math.min(width, height) / 2;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    const isResultValid = result !== null && result < items.length;

    const minDuration = 6;
    const maxDuration = 12;

    const calculateIndex = (spinPointDegree: number): number => {
      let cumulativeWeight = 0;

      for (let i = 0; i < items.length; i++) {
        const segmentDegree = (items[i].weight / totalWeight) * 360;
        cumulativeWeight += segmentDegree;
        if (spinPointDegree < cumulativeWeight) {
          return i;
        }
      }

      return -1;
    };

    const resetWheel = () => {
      setIsSpinning(false);
      setIsSpined(false);
      setResult(null);
    };


    useEffect(() => {
      console.log("useEffect reset fire");
      resetWheel();

      const dur =
        Math.round(Math.random() * (maxDuration - minDuration) + minDuration) *
        1000;
      setDuration(dur);
    }, [items]);

    useEffect(() => {
      console.log("useEffect spin fire");
      if (!isSpinning) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      const checkRotation = () => {
        if (!wheelRef.current) return;

        const style = window.getComputedStyle(wheelRef.current);
        const transform = style.getPropertyValue("transform");
        const matrix = new DOMMatrixReadOnly(transform);

        const currentRotation = Math.round(
          Math.atan2(matrix.b, matrix.a) * (180 / Math.PI)
        );

        const spinPointDegree = (360 - currentRotation + 90) % 360;
        const curIndex = calculateIndex(spinPointDegree);

        if (curIndex !== lastSegmentIndexRef.current) {
          console.log(curIndex);
          console.log(lastSegmentIndexRef.current);

          lastSegmentIndexRef.current = curIndex;
          const soundEff = new Audio(indexChangeSoundEffect);
          soundEff.volume = 0.6;
          soundEff.play();

          if (onCurrentIndexChange) {
            onCurrentIndexChange(curIndex);
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkRotation);
      };

      animationFrameRef.current = requestAnimationFrame(checkRotation);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isSpinning, onCurrentIndexChange, items, totalWeight]);

    const spinWheel = () => {
      if (isSpinning || totalWeight === 0) return;

      if (isSpined) {
        handleReroll();
        return;
      }

      setIsSpinning(true);
      setIsSpined(true);
      setRotation(0);
      setResult(null);

      if (onStartSpin) {
        onStartSpin();
      }

      const randomDegree = Math.floor(Math.random() * 360) + 3600;
      const newRotation = rotation + randomDegree;
      setRotation(newRotation);

      setTimeout(() => {
        setIsSpinning(false);

        const finalDegree = newRotation % 360;
        const spinPointDegree = (360 - finalDegree + 90) % 360;
        const finalResult = calculateIndex(spinPointDegree);
        setResult(finalResult);

        if (onRest) {
          onRest(finalResult);
        }
      }, duration);
    };

    const handleReroll = () => {
      setShowResetDialog(true);
    };

    const handleConfirmReroll = () => {
      resetWheel();
      setShowResetDialog(false);
    };

    const handleCancelReroll = () => {
      setShowResetDialog(false);
    };

    const renderSegments = () => {
      let cumulativeAngle = 0;
      const textRadius = radius * 0.88;

      return items.map((item, index) => {
        const segmentAngle = (item.weight / totalWeight) * 360;

        const startAngle = cumulativeAngle;
        const endAngle = startAngle + segmentAngle;
        const midAngle = startAngle + segmentAngle / 2;

        const startPointX =
          Math.cos(((startAngle - 90) * Math.PI) / 180) * radius;
        const startPointY =
          Math.sin(((startAngle - 90) * Math.PI) / 180) * radius;
        const endPointX = Math.cos(((endAngle - 90) * Math.PI) / 180) * radius;
        const endPointY = Math.sin(((endAngle - 90) * Math.PI) / 180) * radius;
        const isLargeArc = segmentAngle > 180 ? 1 : 0;
        const pathData = `M 0 0 L ${startPointX} ${startPointY} A ${radius} ${radius} 0 ${isLargeArc} 1 ${endPointX} ${endPointY} Z`;

        const textX = Math.cos(((midAngle - 90) * Math.PI) / 180) * textRadius;
        const textY = Math.sin(((midAngle - 90) * Math.PI) / 180) * textRadius;
        const angle = midAngle - 90;

        cumulativeAngle += segmentAngle;

        return (
          <g
            key={index}
            transform={`translate(${width / 2}, ${height / 2})`}
            className={`transition-transform duration-200`}
          >
            <path
              d={pathData}
              fill={
                item.color == ""
                  ? COLOR_PALETTE[index % COLOR_PALETTE.length]
                  : item.color
              }
              stroke="black"
              strokeWidth="0"
              className=""
              onMouseEnter={() => {
                if (isSpinning) return;
                if (onMouseEnter) onMouseEnter(index);
              }}
            />
            <text
              x={textX}
              y={textY}
              fill="black"
              stroke="amber"
              textAnchor="end"
              dominantBaseline="middle"
              transform={`rotate(${angle}, ${textX}, ${textY})`}
              className="pointer-events-none text-2xl"
            >
              {item.name}
            </text>
          </g>
        );
      });
    };

    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="relative text-3xl font-bold text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)] tracking-widest">
          {title}
        </h1>
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden"
          onMouseLeave={() => {
            if (isSpinning) return;
            if (onMouseLeave) onMouseLeave();
          }}
        >
          <svg
            className={`relative transform ease-[cubic-bezier(0.61, 1, 0.88, 1)] flex m-0.5`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: `${duration}ms`,
              height: height,
              width: width,
            }}
            ref={wheelRef}
          >
            {renderSegments()}
          </svg>
          <img
            src={arrow}
            alt="Wheel arrow"
            className="ml-[10px] size-[100px] rotate-90 absolute z-10 pointer-events-auto"
          />
          <img
            src={wheelBorder}
            alt="Wheel's border"
            className="absolute z-10 transform size-full pointer-events-none"
          />
        </div>
        {/* Result */}
        {isSpined && !isSpinning && isResultValid && (
          <div className="absolute top-1/12 whitespace-pre-line items-center flex flex-col max-w-[800px] z-50 border-2 border-[#d4af37] bg-black/80 rounded-md text-amber-200 font-bold p-4">
            <p>Xin chúc mừng, bạn nhận được:</p>
            <h1 className="text-4xl my-4">{items[result].name}</h1>
            {items[result].description && <p>{items[result].description}</p>}
            {items[result].effect && (
              <p className="space-y-2 text-amber-200">{items[result].effect}</p>
            )}
          </div>
        )}
        <div className="flex gap-1">
          <button
            onClick={isSpined ? handleReroll : spinWheel}
            disabled={isSpinning}
            className="relative px-6 py-1 bg-gray-600 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
          >
            {isSpinning ? "Spinning..." : isSpined ? "Reroll" : "Spin"}
          </button>
          {!isSpinning && result != null && (
            <button
              onClick={handleNext}
              className="relative px-6 py-1 bg-green-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
            >
              Next
            </button>
          )}
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetDialog && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-[#2a1810] border-2 border-[#8a5b1a] rounded-lg p-8 max-w-md mx-4 shadow-[0_0_30px_rgba(200,50,50,0.6)]">
              <h3 className="text-xl font-bold text-[#d4af37] mb-4 text-center">
                Confirm Reroll
              </h3>
              <p className="text-[#f5e6d3] mb-6 text-center">
                Are you sure you want to reroll this wheel? This will clear
                current result.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCancelReroll}
                  className="px-6 py-3 bg-gray-600 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReroll}
                  className="px-6 py-3 bg-red-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Wheel;
