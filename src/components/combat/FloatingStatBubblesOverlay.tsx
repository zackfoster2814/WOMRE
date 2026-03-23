import { StatBubble } from "../../types/battleZone";

interface FloatingStatBubblesOverlayProps {
  p1Bubbles: StatBubble[];
  p2Bubbles: StatBubble[];
}

export const FloatingStatBubblesOverlay = ({
  p1Bubbles,
  p2Bubbles,
}: FloatingStatBubblesOverlayProps) => {
  const all = [...p1Bubbles, ...p2Bubbles];
  if (all.length === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {all.map((b) => (
        <div
          key={b.id}
          className="absolute animate-float-up-fade"
          style={{ left: `${b.x}%`, bottom: `${b.startY}%` }}
        >
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-sm font-black shadow-xl select-none whitespace-nowrap ${
              b.isPositive
                ? "bg-green-500 text-white drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]"
                : "bg-red-500 text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
            }`}
          >
            {b.text}
          </span>
        </div>
      ))}
    </div>
  );
};
