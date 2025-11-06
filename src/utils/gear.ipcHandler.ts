import { ipcMain } from "electron";
import { getAllGears,getGearByLegacy } from "../db/gear.model.js";

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
  ipcMain.handle("fetch-gear-by-legacy", async (event, id: number) => {
    try {
      const gear = await getGearByLegacy(id);
      return gear;
    } catch (error) {
      console.error("Error fetching gear by legacy ID:", error);
      throw error;
    }
  });
}