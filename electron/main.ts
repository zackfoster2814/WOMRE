import { registerArchetypeIpcHandlers } from "../src/utils/archetype.ipcHandler.js";
import { registerCharacterDevelopmentIpcHandlers } from "../src/utils/character-development.ipcHandler.js";
import { registerEnchantIpcHandlers } from "../src/utils/enchant.ipcHandler.js";
import { registerEventIpcHandlers } from "../src/utils/event.ipcHandler.js";
import { registerGearIpcHandlers } from "../src/utils/gear.ipcHandler.js";
import { registerHouseIpcHandlers } from "../src/utils/house.ipcHandler.js";
import { registerMatchEventIpcHandlers } from "../src/utils/match-event.ipcHandler.js";
import { registerMatchRewardIpcHandlers } from "../src/utils/match_reward.ipcHandler.ts";
import { registerMatchIpcHandlers } from "../src/utils/match.ipcHandler.js";
import { registerPlayerArchetypesIpcHandlers } from "../src/utils/player-archetypes.ipcHandler.js";
import { registerPlayerCharDevIpcHandlers } from "../src/utils/player-chardev.ipcHandler.js";
import { registerPlayerGearIpcHandlers } from "../src/utils/player-gear.ipcHandler.js";
import { registerPlayerPowerIpcHandlers } from "../src/utils/player-power.ipcHandler.js";
import { registerPlayerQuirksIpcHandlers } from "../src/utils/player-quirks.ipcHandler.js";
import { registerPlayerWeaponIpcHandlers } from "../src/utils/player-weapon.ipcHandler.js";
import { registerPowerIpcHandlers } from "../src/utils/power.ipcHandler.js";
import { registerPveIpcHandlers } from "../src/utils/pve.ipcHandler.js";
import { registerQuirkIpcHandlers } from "../src/utils/quirk.ipcHandler.js";
import { registerRaceIpcHandlers } from "../src/utils/race.ipcHandler.js";
import { registerRewardIpcHandlers } from "../src/utils/reward.ipcHandler.js";
import { registerSubraceIpcHandlers } from "../src/utils/subrace.ipcHandler.js";
import { registerTournamentPhaseIpcHandlers } from "../src/utils/tournament-phase.ipcHandler.js";
import { registerWeaponEnchantIpcHandlers } from "../src/utils/weapon-enchant.ipcHandler.js";
import { registerWeaponIpcHandlers } from "../src/utils/weapon.ipcHandler.js";
import { registerPlayerIpcHandlers } from "../src/utils/player.ipcHandler.js";
import { BrowserView, app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

app.whenReady().then(async () => {
  try {
    // Import modules dynamically since we're in production
    let initDb;
    try {
      const dbModule = await import("../src/db/index.js");
      initDb = dbModule.default || dbModule;
    } catch (error) {
      console.log("Could not load database module:", error.message);
    }

    // Initialize database first
    if (initDb) {
      await initDb();
    }

    // Register IPC handlers
    try {
      registerPlayerIpcHandlers();
      registerRaceIpcHandlers();
      registerWeaponIpcHandlers();
      registerWeaponEnchantIpcHandlers();
      registerTournamentPhaseIpcHandlers();
      registerArchetypeIpcHandlers();
      registerCharacterDevelopmentIpcHandlers();
      registerEnchantIpcHandlers();
      registerEventIpcHandlers();
      registerGearIpcHandlers();
      registerHouseIpcHandlers();
      registerMatchIpcHandlers();
      registerMatchEventIpcHandlers();
      registerMatchRewardIpcHandlers();
      registerPlayerArchetypesIpcHandlers();
      registerPlayerCharDevIpcHandlers();
      registerPlayerGearIpcHandlers();
      registerPlayerPowerIpcHandlers();
      registerPlayerQuirksIpcHandlers();
      registerPlayerWeaponIpcHandlers();
      registerPowerIpcHandlers();
      registerPveIpcHandlers();
      registerQuirkIpcHandlers();
      registerRewardIpcHandlers();
      registerSubraceIpcHandlers();
      console.log("IPC handlers registered successfully");
    } catch (error) {
      console.error("Failed to register IPC handlers:", error.message);
    }

    win = new BrowserWindow({
      width: 1920,
      height: 1080,
      // fullscreen: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"), // Changed from .ts to .js
        nodeIntegration: true,
        contextIsolation: true,
        webSecurity: false, // Allow loading local files
      },
      show: false, // Start hidden
    });

    // Force window to appear
    win.once("ready-to-show", () => {
      win.show();
      win.focus();
      win.setAlwaysOnTop(true);
      setTimeout(() => {
        win.setAlwaysOnTop(false);
      }, 1000);
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(process.env.VITE_DEV_SERVER_URL);
      win.webContents.openDevTools();
    } else {
      // Load index.html from root of dist (not dist/src)
      const htmlPath = path.join(__dirname, "../dist/index.html");
      console.log("Loading HTML from:", htmlPath);
      console.log("__dirname:", __dirname);

      // Check if file exists
      if (fs.existsSync(htmlPath)) {
        console.log("HTML file exists, loading...");
        win.loadFile(htmlPath);
      } else {
        console.log("HTML file not found, trying alternative paths...");

        // Try other possible paths
        const altPaths = [
          path.join(__dirname, "../dist/src/index.html"),
          path.join(__dirname, "../../dist/index.html"),
          path.join(__dirname, "../../dist/src/index.html"),
        ];

        let loaded = false;
        for (const altPath of altPaths) {
          console.log("Trying:", altPath);
          if (fs.existsSync(altPath)) {
            console.log("Found HTML at:", altPath);
            win.loadFile(altPath);
            loaded = true;
            break;
          }
        }

        if (!loaded) {
          console.error("No HTML file found!");
          // Create error page
          win.loadURL(
            `data:text/html,<h1>Error: HTML file not found</h1><p>Checked paths:</p><ul><li>${htmlPath}</li>${altPaths
              .map((p) => `<li>${p}</li>`)
              .join("")}</ul>`
          );
        }
      }

      // Open dev tools to debug
      // win.webContents.openDevTools();
    }

    // Debug events
    win.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        console.error(
          "Failed to load:",
          errorCode,
          errorDescription,
          validatedURL
        );
      }
    );

    win.webContents.on("did-finish-load", () => {
      console.log("Page loaded successfully");
      win.show();
      win.focus();
    });

    win.on("closed", () => {
      win = null;
    });
  } catch (error) {
    console.error("Error starting app:", error);

    // Create a simple error window
    const errorWin = new BrowserWindow({
      width: 800,
      height: 600,
      show: true,
      webPreferences: {
        webSecurity: false,
      },
    });
    errorWin.loadURL(
      `data:text/html,<h1>Error: ${error.message}</h1><pre>${error.stack}</pre>`
    );
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Recreate window on activate
    app.emit("ready");
  }
});
