import { ipcMain } from "electron";
import { getAllPlayerGears } from "../db/player_gear.model.js";

export function registerPlayerGearIpcHandlers() {
  ipcMain.handle("fetch-player-gears", async () => {
    try {
      const playerGears = await getAllPlayerGears();
      return playerGears;
    } catch (error) {
      console.error("Error fetching player-gears:", error);
      throw error;
    }
  });
}