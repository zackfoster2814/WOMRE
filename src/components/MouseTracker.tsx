import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface MouseTrackerProps {
  children: ReactNode;
  offset?: { x: number; y: number };
}

const MouseTracker = ({
  children,
  offset = { x: 0, y: 0 },
}: MouseTrackerProps) => {
  const element = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (element.current) {
        const rect = element.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = e.clientX + offset.x;
        let y = e.clientY + offset.y;

        if (x + rect.width > viewportWidth) {
          x = e.clientX - rect.width - offset.x;
        }

        if (y + rect.height > viewportHeight) {
          y = e.clientY - rect.height - offset.y;
        }

        x = Math.max(0, x);
        y = Math.max(0, y);

        element.current.style.transform = `translate(${x}px, ${y}px)`;
        element.current.style.visibility = "visible";
      }
    }
    document.addEventListener("mousemove", handler);

    return () => document.removeEventListener("mousemove", handler);
  }, [offset.x, offset.y]);

  return createPortal(
    <div
      className="fixed pointer-events-none invisible z-50 top-0 left-0 will-change-transform"
      ref={element}
    >
      {children}
    </div>,
    document.body
  );
};

export default MouseTracker;
