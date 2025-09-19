import { ipcMain } from "electron";
import { getAllEnchants } from "../db/enchant.model.js";

export function registerEnchantIpcHandlers() {
  ipcMain.handle("fetch-enchants", async () => {
    try {
      const enchants = await getAllEnchants();
      return enchants;
    } catch (error) {
      console.error("Error fetching enchants:", error);
      throw error;
    }
  });
}