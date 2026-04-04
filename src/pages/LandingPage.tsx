import React from "react";
import { useNavigate } from "react-router-dom";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface">
      {/* Background layer: Wheel-bg + Stardust */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: "url('/assets/wheel-bg.png')" }}
      />
      <div className="absolute inset-0 pointer-events-none">
        {/* We can simulate stardust by just having a div that has the animation class from tailwind */}
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-surface to-surface/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-12 p-8 animate-fade-in">
        {/* Epic Title */}
        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-primary to-amber-700 bloom drop-shadow-2xl">
            WHEEL OF MULTIVERSE
          </h1>
          <p className="font-lore text-xl md:text-2xl text-amber-500/80 tracking-widest uppercase">
            Season 3
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={() => navigate("/wheel")}
          className="group relative mt-12 px-12 py-4 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
        >
          {/* Runic Glow effect backing the button */}
          <div className="absolute inset-0 bg-primary/20 blur-md group-hover:bg-primary/40 transition-colors duration-500" />
          <div className="absolute inset-0 rounded-full border border-primary/50 group-hover:border-primary shadow-[0_0_15px_rgba(255,209,108,0.5)] group-hover:shadow-[0_0_30px_rgba(255,209,108,0.8)] transition-all duration-500" />

          <span className="relative z-10 font-display text-2xl font-bold text-white tracking-[0.2em] uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            Start
          </span>
        </button>

        {/* Floating Particles decoration */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-primary/80 to-transparent" />
        </div>
      </div>
    </div>
  );
};
