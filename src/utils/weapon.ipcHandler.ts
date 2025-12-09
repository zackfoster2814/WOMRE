import { ipcMain } from "electron";
import { getAllWeapons, getWeaponByUnique } from "../db/weapon.model.js";

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
  ipcMain.handle("fetch-unique-weapons", async (_event, id: number) => {
    try {
      const uniqueWeapons = await getWeaponByUnique(id);
      return uniqueWeapons;
    } catch (error) {
      console.error("Error fetching unique weapons:", error);
      throw error;
    }
  });
}