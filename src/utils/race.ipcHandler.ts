import { ipcMain } from "electron";
import { getAllRaces } from "../db/race.model.js";

export function registerRaceIpcHandlers() {
  console.log("a")
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