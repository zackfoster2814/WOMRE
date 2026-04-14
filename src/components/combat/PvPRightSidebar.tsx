import { motion, AnimatePresence } from "framer-motion";
// import { useState } from "react";

interface PvPRightSidebarProps {
  onButtonClick: (type: "power" | "gear" | "chardev") => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

export const PvPRightSidebar = ({
  onButtonClick,
  isOpen,
  onToggle,
}: PvPRightSidebarProps) => {
  const buttons = [
    {
      id: "power",
      label: "Power",
      icon: "⚡",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "gear",
      label: "Gear",
      icon: "🛡️",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "chardev",
      label: "CharDev",
      icon: "🧬",
      color: "from-emerald-500 to-teal-600",
    },
  ] as const;

  return (
    <div className="fixed top-0 right-0 h-screen z-[2000] flex pointer-events-none">
      {/* Toggle Tab - Always clickable */}
      <button
        onClick={() => onToggle(!isOpen)}
        className={`absolute right-full top-1/2 -translate-y-1/2 pointer-events-auto w-8 h-32 flex flex-col items-center justify-center gap-4 transition-all duration-300 border-y border-l bg-gray-900/90 backdrop-blur-md rounded-l-xl ${
          isOpen
            ? "border-primary shadow-[0_0_15px_rgba(255,191,0,0.3)]"
            : "border-white/10 hover:border-primary/50"
        }`}
      >
        <span className="text-[10px] font-black font-display uppercase tracking-widest text-primary/70 [writing-mode:vertical-lr] rotate-180">
          Available Wheels
        </span>
        <span
          className={`text-xs transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          ◀
        </span>
      </button>

      {/* Sidebar Panel */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 120 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full bg-surface/95 backdrop-blur-xl border-l border-primary/20 overflow-hidden flex flex-col items-center py-6 gap-6 pointer-events-auto"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center gap-6 w-full px-2"
            >
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-50 block mb-1">
                  Wheel
                </span>
                <div className="w-8 h-[1px] bg-primary/30 mx-auto" />
              </div>

              {buttons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => onButtonClick(btn.id)}
                  className="group relative flex flex-col items-center gap-2 justify-center p-3 w-16 h-16 rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 transition-all duration-300 transform hover:scale-110"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${btn.color} opacity-0 group-hover:opacity-20 transition-opacity rounded-xl`}
                  />
                  <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                    {btn.icon}
                  </span>
                  <span className="text-[9px] font-bold font-display uppercase tracking-tighter text-white/70 group-hover:text-primary transition-colors">
                    {btn.label}
                  </span>
                </button>
              ))}

              <div
                className="mt-auto opacity-20 hover:opacity-100 transition-opacity cursor-help"
                title="More wheels coming soon"
              >
                <span className="text-[10px] font-mono text-white/50">...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
