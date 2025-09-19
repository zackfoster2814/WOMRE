import { ipcMain } from "electron";
import { getAllPlayerWeapons } from "../db/player_weapon.model.js";

export function registerPlayerWeaponIpcHandlers() {
  ipcMain.handle("fetch-player-weapons", async () => {
    try {
      const playerWeapons = await getAllPlayerWeapons();
      return playerWeapons;
    } catch (error) {
      console.error("Error fetching player-weapons:", error);
      throw error;
    }
  });
}