import { ipcMain } from "electron";
import { getAllGears } from "../db/gear.model";

export function registerGearIpcHandlers() {
  ipcMain.handle("fetch-gears", async () => {
    try {
      const gears = await getAllGears();
      return gears;
    } catch (error) {
      console.error("Error fetching gears:", error);
      throw error;
    }
  });
}