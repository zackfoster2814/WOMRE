import { app, BrowserWindow } from "electron";
import path from "path";
import initDb from "../src/db/index.ts";
import { registerPlayerIpcHandlers } from "../src/utils/player.ipcHandler.ts";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow;

app.whenReady().then(async () => {
  await initDb();
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });
  registerPlayerIpcHandlers();
  //goi cac ipc handler khac tai day

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(app.getAppPath(), "../dist/index.html"));
  }
});
