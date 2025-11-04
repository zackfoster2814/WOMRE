import { ipcMain } from "electron";
import { getAllRaces,getRacesWithSubraceWheel } from "../db/race.model.js";

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
  ipcMain.handle("fetch-races-with-subrace-wheel", async () => {
    try {
      const races = await getRacesWithSubraceWheel();
      return races;
    } catch (error) {
      console.error("Error fetching races with subrace wheel:", error);
      throw error;
    }
  });
}