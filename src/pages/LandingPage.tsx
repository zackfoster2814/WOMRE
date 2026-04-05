import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LandingBackground3D } from "../components/three/LandingBackground3D";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 1.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }
    },
  };

  const titleLines = "WHEEL OF MULTIVERSE".split("");

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black font-sans">
      {/* 3D Background Layer */}
      <LandingBackground3D />

      {/* Intro Reveal Screen (Cinematic fade from black to view) */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="absolute inset-0 z-50 bg-black pointer-events-none"
      />

      {/* Content Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 flex flex-col items-center justify-center text-center space-y-12 p-8"
      >
        {/* Epic Title with Letter Animation */}
        <div className="space-y-4">
          <motion.h1
            className="font-display text-4xl md:text-6xl lg:text-8xl tracking-[0.25em]"
          >
            {titleLines.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 1.5,
                  delay: 0.8 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1] as any
                }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-primary to-amber-800 drop-shadow-[0_0_15px_rgba(255,209,108,0.3)] filter brightness-110"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.div variants={itemVariants} className="overflow-hidden">
            <p className="font-lore text-xl md:text-2xl text-amber-500/80 tracking-[0.4em] uppercase">
              Season 3
            </p>
          </motion.div>
        </div>

        {/* Start Button with Glow & Scale Entrance */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => navigate("/wheel")}
            className="group relative mt-16 px-16 py-5 rounded-full overflow-hidden transition-all duration-700 hover:scale-110 active:scale-95"
          >
            {/* Button Aura */}
            <div className="absolute inset-0 bg-primary/10 blur-xl group-hover:bg-primary/25 transition-all duration-700" />

            {/* Runic Glow Border */}
            <div className="absolute inset-0 rounded-full border border-primary/40 group-hover:border-primary shadow-[0_0_20px_rgba(255,209,108,0.3)] group-hover:shadow-[0_0_40px_rgba(255,209,108,0.6)] transition-all duration-700" />

            {/* Inner Sheen */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <span className="relative z-10 font-display text-2xl font-bold text-white tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Enter The Void
            </span>

            {/* Subtle glimmer effect on hover */}
            <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </button>
        </motion.div>

        {/* Dynamic Floating Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 2 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="w-px h-16 bg-gradient-to-b from-primary/60 to-transparent" />
          <span className="text-[10px] text-amber-500/40 tracking-[0.5em] uppercase">V.3.1.0</span>
        </motion.div>
      </motion.div>

      {/* Interactive Cursor Glow (Optional, can be added with hook) */}
    </div>
  );
};
