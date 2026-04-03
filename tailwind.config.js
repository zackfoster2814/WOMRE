/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",     // Level 1 — nút nhỏ, chỉ số, tag
        lg: "10px",    // Level 2 — thẻ vật phẩm, nút chính
        xl: "14px",
        "2xl": "20px", // Level 3 — bảng chính, cổng dịch vụ
        "3xl": "28px",
        full: "9999px",
      },
      colors: {
        // ── Remap gray scale → Arcane Ledger void palette ──
        // All existing bg-gray-*/text-gray-*/border-gray-* auto-migrate
        gray: {
          950: "#0c0e12",
          900: "#111318",
          850: "#141720",
          800: "#171a1f",
          750: "#1b1e24",
          700: "#1e2128",
          650: "#21242a",
          600: "#23262c",
          550: "#272b32",
          500: "#2c3038",
          450: "#363a42",
          400: "rgba(255,255,255,0.45)",
          300: "rgba(255,255,255,0.6)",
          200: "rgba(255,255,255,0.72)",
          100: "rgba(255,255,255,0.85)",
          50:  "rgba(255,255,255,0.92)",
        },
        // Remap black → deep void (not pure black)
        black: "#0c0e12",
        // Void Neutrals — named tokens
        "surface":               "#0c0e12",
        "surface-low":           "#111318",
        "surface-container":     "#171a1f",
        "surface-container-high":"#1e2128",
        "surface-highest":       "#23262c",
        "surface-bright":        "#2c3038",
        // Primary — Gold (remap yellow/amber)
        "primary":               "#ffd16c",
        "primary-dim":           "#c9a24f",
        "primary-container":     "#fdc003",
        yellow: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#ffd16c",  // → primary
          500: "#fdc003",  // → primary-container
          600: "#c9a24f",  // → primary-dim
          700: "#a17c2e",
          800: "#7c5e1e",
          900: "#594210",
        },
        amber: {
          400: "#ffd16c",
          500: "#fdc003",
          600: "#c9a24f",
        },
        // Secondary — Mana (cyan; keep blue for p1 semantic use)
        "secondary":             "#56f1e0",
        "secondary-dim":         "#38b8ac",
        // Tertiary — Arcane (remap purple)
        "tertiary":              "#e69dff",
        "tertiary-dim":          "#b06fd0",
        purple: {
          300: "#e69dff",
          400: "#d67ef5",
          500: "#c060e0",
          600: "#b06fd0",
          700: "#8a4db0",
          800: "#623590",
          900: "#3d1f60",
          950: "#200e36",
        },
        // Outline
        "outline":               "#46484d",
        "outline-dim":           "rgba(70,72,77,0.2)",
        // Error / stat negative
        "error":                 "#ff6b6b",
        "error-dim":             "#c0392b",
        // Green stays semantic (win/alive)
        green: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // Red stays semantic (lose/dead) — slightly warmer
        red: {
          400: "#ff6b6b",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#450a0a",
          950: "#2d0606",
        },
      },
      fontFamily: {
        display: ["Cinzel", "Playfair Display", "Newsreader", "Georgia", "serif"],
        lore:    ["Playfair Display", "Newsreader", "Georgia", "serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["Space Grotesk", "monospace"],
      },
      keyframes: {
        "slide-in": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "100%": { display: "none" },
        },
        "draw-circle": {
          "0%":   { "stroke-dashoffset": "360" },
          "100%": { "stroke-dashoffset": "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px 1px rgba(255,209,108,0.2)" },
          "50%":       { boxShadow: "0 0 14px 4px rgba(255,209,108,0.5)" },
        },
        "bracket-glow": {
          "0%, 100%": { boxShadow: "0 0 6px 2px rgba(230,157,255,0.15)" },
          "50%":       { boxShadow: "0 0 14px 5px rgba(230,157,255,0.4)" },
        },
        "float-up-fade": {
          "0%":   { opacity: "1",   transform: "translateX(-50%) translateY(0) scale(1)" },
          "60%":  { opacity: "0.9", transform: "translateX(-50%) translateY(-40px) scale(1.05)" },
          "100%": { opacity: "0",   transform: "translateX(-50%) translateY(-70px) scale(0.9)" },
        },
        "glimmer": {
          "0%":   { transform: "translateX(-100%) skewX(-20deg)", opacity: "0" },
          "40%":  { opacity: "0.4" },
          "60%":  { opacity: "0.4" },
          "100%": { transform: "translateX(300%) skewX(-20deg)", opacity: "0" },
        },
        "bloom-in": {
          "0%":   { boxShadow: "0 0 0px 0px rgba(255,209,108,0)" },
          "100%": { boxShadow: "0 0 30px 8px rgba(255,209,108,0.1)" },
        },
        "rune-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 1.5px rgba(255,209,108,0.4), 0 0 12px 2px rgba(255,209,108,0.1)" },
          "50%":       { boxShadow: "0 0 0 1.5px rgba(255,209,108,0.85), 0 0 24px 6px rgba(255,209,108,0.28)" },
        },
        "crystal-charge": {
          "0%":   { transform: "translateX(-100%) skewX(-15deg)", opacity: "0" },
          "20%":  { opacity: "1" },
          "80%":  { opacity: "1" },
          "100%": { transform: "translateX(200%) skewX(-15deg)", opacity: "0" },
        },
        "stardust": {
          "0%":   { transform: "translateY(0) translateX(0) scale(1)", opacity: "0" },
          "10%":  { opacity: "0.7" },
          "90%":  { opacity: "0.2" },
          "100%": { transform: "translateY(-80px) translateX(15px) scale(0.4)", opacity: "0" },
        },
      },
      animation: {
        "float-up-fade": "float-up-fade 3s ease-out forwards",
        "slide-in":      "slide-in 0.3s ease-out",
        "fade-in":       "fade-in forwards",
        "draw-circle":   "draw-circle forwards",
        "fade-out":      "fade-out forwards",
        "glow-pulse":    "glow-pulse 2s ease-in-out infinite",
        "bracket-glow":  "bracket-glow 3s ease-in-out infinite",
        "glimmer":       "glimmer 5s ease-in-out infinite",
        "bloom-in":       "bloom-in 0.3s ease-out forwards",
        "rune-pulse":     "rune-pulse 2s ease-in-out infinite",
        "crystal-charge": "crystal-charge 1.8s ease-in-out infinite",
        "stardust":       "stardust 4s ease-out infinite",
      },
      boxShadow: {
        "bloom":        "0 0 30px 8px rgba(255,209,108,0.1)",
        "bloom-md":     "0 0 20px 4px rgba(255,209,108,0.15)",
        "bloom-cyan":   "0 0 20px 4px rgba(86,241,224,0.15)",
        "bloom-arcane": "0 0 20px 4px rgba(230,157,255,0.15)",
        "bevel":        "inset 0.5px 0.5px 0 rgba(255,255,255,0.08), inset -0.5px -0.5px 0 rgba(0,0,0,0.4)",
        "bevel-gold":   "inset 0.5px 0.5px 0 rgba(255,209,108,0.15), inset -0.5px -0.5px 0 rgba(0,0,0,0.5)",
        // Astral Fantasy panels
        "panel-l1":     "0 8px 32px rgba(0,0,0,0.8)",
        "card-float":   "0 20px 40px -15px rgba(139,92,246,0.3)",
        "rune-winner":  "0 0 0 1.5px rgba(255,209,108,0.8), 0 0 24px 6px rgba(255,209,108,0.28)",
        "rune-loser":   "0 0 0 1.5px rgba(239,68,68,0.5), 0 0 16px 3px rgba(239,68,68,0.15)",
      },
      backgroundImage: {
        "btn-primary":    "linear-gradient(135deg, #ffd16c 0%, #fdc003 100%)",
        "btn-primary-hover": "linear-gradient(135deg, #ffe08a 0%, #ffd116 100%)",
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
