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
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in forwards",
        "draw-circle": "draw-circle forwards",
        "fade-out": "fade-out forwards",
      },
    },
  },
  plugins: [],
};
