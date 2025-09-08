import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";

// Build TypeScript for Electron
console.log("Building Electron TypeScript...");
execSync("tsc -p electron/tsconfig.json", { stdio: "inherit" });

// Copy necessary files from src to dist-electron
const filesToCopy = [
  { from: "src/db/index.ts", to: "dist-electron/src/db/index.js" },
  {
    from: "src/utils/player.ipcHandler.ts",
    to: "dist-electron/src/utils/player.ipcHandler.js",
  },
];

filesToCopy.forEach(({ from, to }) => {
  const dir = dirname(to);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Compile individual TS files
  const compiledFile = from.replace(".ts", ".js");
  execSync(
    `npx tsc ${from} --outDir ${dirname(
      to
    )} --module ESNext --target ES2020 --moduleResolution bundler`,
    { stdio: "inherit" }
  );
});

console.log("Electron build completed!");
