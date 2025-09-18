import { ipcMain } from "electron";
import { getAllPowers } from "../db/power.model";

export function registerPowerIpcHandlers() {
  ipcMain.handle("fetch-powers", async () => {
    try {
      const powers = await getAllPowers();
      return powers;
    } catch (error) {
      console.error("Error fetching powers:", error);
      throw error;
    }
  });
}