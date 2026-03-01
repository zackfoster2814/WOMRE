/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "100%": {
            display: "none",
          },
        },
        "draw-circle": {
          "0%": { "stroke-dashoffset": "360" },
          "100%": { "stroke-dashoffset": "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px 1px rgba(74, 222, 128, 0.3)" },
          "50%": { boxShadow: "0 0 10px 3px rgba(74, 222, 128, 0.7)" },
        },
        "bracket-glow": {
          "0%, 100%": { boxShadow: "0 0 6px 2px rgba(139, 92, 246, 0.2)" },
          "50%": { boxShadow: "0 0 12px 4px rgba(139, 92, 246, 0.5)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in forwards",
        "draw-circle": "draw-circle forwards",
        "fade-out": "fade-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "bracket-glow": "bracket-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
