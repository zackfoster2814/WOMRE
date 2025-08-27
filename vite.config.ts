import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./src",
  build: {
    outDir: "../dist",
  },
  optimizeDeps: {
    exclude: ["pg-hstore", "pg", "mysql2", "tedious"], // bỏ các driver không dùng
  },
});
