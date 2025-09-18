import { ipcMain } from "electron";
import { getAllWeapons } from "../db/weapon.model";

export function registerWeaponIpcHandlers() {
  ipcMain.handle("fetch-weapons", async () => {
    try {
      const weapons = await getAllWeapons();
      return weapons;
    } catch (error) {
      console.error("Error fetching weapons:", error);
      throw error;
    }
  });
}