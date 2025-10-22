import { ipcMain } from "electron";
import { getAllPlayerCharDevs } from "../db/player_chardev.model.js";

export function registerPlayerCharDevIpcHandlers() {
  ipcMain.handle("fetch-player-chardevs", async () => {
    try {
      const playerCharDevs = await getAllPlayerCharDevs();
      return playerCharDevs;
    } catch (error) {
      console.error("Error fetching player-chardevs:", error);
      throw error;
    }
  });
}