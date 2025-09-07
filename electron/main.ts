const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

app.whenReady().then(async () => {
  try {
    // Import modules dynamically since we're in production
    let initDb, registerPlayerIpcHandlers;

    try {
      const dbModule = require("../src/db/index.js");
      initDb = dbModule.default || dbModule;

      const ipcModule = require("../src/utils/player.ipcHandler.js");
      registerPlayerIpcHandlers = ipcModule.registerPlayerIpcHandlers;
    } catch (error) {
      console.log("Could not load modules:", error.message);
      // Continue without modules for now
    }

    if (initDb) {
      await initDb();
    }

    win = new BrowserWindow({
      width: 1920,
      height: 1080,
      // fullscreen: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true,
        contextIsolation: true,
        webSecurity: false, // Allow loading local files
      },
      show: false, // Start hidden
    });

    if (registerPlayerIpcHandlers) {
      registerPlayerIpcHandlers();
    }

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
      const fs = require("fs");
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
