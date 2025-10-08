import { ipcMain } from "electron";
import { getAllRaces } from "../db/race.model.js";

export function registerRaceIpcHandlers() {
  ipcMain.handle("fetch-races", async () => {
    try {
      const races = await getAllRaces();
      return races;
    } catch (error) {
      console.error("Error fetching races:", error);
      throw error;
    }
  });
}