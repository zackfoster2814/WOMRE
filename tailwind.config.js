/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter', sans-serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
        ".chart-grid": {
          display: "grid",
          "grid-template-columns": "repeat(1, minmax(0, 1fr))",
          gap: "1rem",
          "@media (min-width: 768px)": {
            "grid-template-columns": "repeat(2, minmax(0, 1fr))",
            "& > *:last-child:nth-child(odd)": {
              "grid-column": "1 / -1",
            },
          },
        },
        ".scrollbar-hide": {
          /* IE and Edge */
          "-ms-overflow-style": "none",
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    },
  ],
};
